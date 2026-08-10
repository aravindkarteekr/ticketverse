import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../src/app.js";
import { UserModel } from "../src/modules/identity/infrastructure/UserModel.js";

let app: Express;

beforeAll(() => {
  app = createApp();
});

/** Signs up a user then promotes them to admin directly via the model (mirrors manual DB promotion). */
async function signupAdmin(email: string) {
  const agent = request.agent(app);
  const signupRes = await agent
    .post("/api/v1/auth/signup")
    .send({ name: "Admin", email, password: "AdminPass123!" });
  await UserModel.updateOne(
    { _id: signupRes.body.id },
    { $set: { role: "admin" } },
  );
  await agent
    .post("/api/v1/auth/login")
    .send({ email, password: "AdminPass123!" });
  return agent;
}

describe("booking flow (happy path + seat-hold conflict)", () => {
  it("lets a user book seats end-to-end and rejects a concurrent double-booking", async () => {
    const admin = await signupAdmin("admin@example.com");

    const movieRes = await admin.post("/api/v1/movies").send({
      title: "E2E Test Movie",
      description: "A movie used purely for automated testing.",
      durationMinutes: 100,
      genres: ["Action"],
      language: "English",
      releaseDate: "2026-01-01",
    });
    expect(movieRes.status).toBe(201);

    const ownerAgent = request.agent(app);
    await ownerAgent.post("/api/v1/auth/signup").send({
      name: "Owner",
      email: "owner@example.com",
      password: "OwnerPass123!",
    });

    const requestRes = await ownerAgent
      .post("/api/v1/theatre-owner-requests")
      .send({
        theatreName: "Test Cinema",
        city: "Testville",
      });
    expect(requestRes.status).toBe(201);

    const reviewRes = await admin
      .post(`/api/v1/theatre-owner-requests/${requestRes.body.id}/review`)
      .send({ decision: "approved" });
    expect(reviewRes.status).toBe(204);

    // Role change bumped tokenVersion — the owner must re-authenticate to pick up the new role.
    await ownerAgent
      .post("/api/v1/auth/login")
      .send({ email: "owner@example.com", password: "OwnerPass123!" });

    const theatresRes = await ownerAgent.get("/api/v1/theatres/mine");
    expect(theatresRes.status).toBe(200);
    const theatreId = theatresRes.body[0].id as string;

    const screenRes = await ownerAgent
      .post(`/api/v1/theatres/${theatreId}/screens`)
      .send({
        name: "Screen 1",
        layout: [{ row: "A", seatCount: 3, seatType: "regular" }],
      });
    expect(screenRes.status).toBe(201);
    const screenId = screenRes.body.id as string;

    const showRes = await ownerAgent.post("/api/v1/shows").send({
      movieId: movieRes.body.id,
      screenId,
      startTime: "2026-02-01T18:00:00.000Z",
      pricing: [{ seatType: "regular", price: 250 }],
    });
    expect(showRes.status).toBe(201);
    const showId = showRes.body.id as string;

    const bookerAgent = request.agent(app);
    await bookerAgent.post("/api/v1/auth/signup").send({
      name: "Booker",
      email: "booker@example.com",
      password: "BookerPass123!",
    });

    const seatsRes = await bookerAgent.get(`/api/v1/shows/${showId}/seats`);
    expect(seatsRes.status).toBe(200);
    expect(seatsRes.body).toHaveLength(3);
    expect(
      seatsRes.body.every(
        (seat: { status: string }) => seat.status === "available",
      ),
    ).toBe(true);

    const holdRes = await bookerAgent
      .post("/api/v1/bookings/hold")
      .send({ showId, seatIds: ["A1", "A2"] });
    expect(holdRes.status).toBe(201);
    expect(holdRes.body.unavailableSeatIds).toEqual([]);

    // A second, concurrent user tries to grab an overlapping seat — must be rejected.
    const rivalAgent = request.agent(app);
    await rivalAgent.post("/api/v1/auth/signup").send({
      name: "Rival",
      email: "rival@example.com",
      password: "RivalPass123!",
    });
    const rivalHoldRes = await rivalAgent
      .post("/api/v1/bookings/hold")
      .send({ showId, seatIds: ["A1", "A3"] });
    expect(rivalHoldRes.status).toBe(409);
    expect(rivalHoldRes.body.unavailableSeatIds).toEqual(["A1"]);

    const bookingRes = await bookerAgent.post("/api/v1/bookings").send({
      showId,
      holdId: holdRes.body.holdId,
      seatIds: ["A1", "A2"],
    });
    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body).toMatchObject({
      status: "pending_payment",
      totalAmount: 500,
    });

    const myBookingsRes = await bookerAgent.get("/api/v1/bookings/mine");
    expect(myBookingsRes.status).toBe(200);
    expect(myBookingsRes.body.items).toHaveLength(1);
  });
});
