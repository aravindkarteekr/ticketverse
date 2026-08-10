import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../src/app.js";

let app: Express;

beforeAll(() => {
  app = createApp();
});

describe("auth flow", () => {
  it("signs up, exposes /me via the session cookie, refreshes, and logs out", async () => {
    const agent = request.agent(app);

    const signupRes = await agent.post("/api/v1/auth/signup").send({
      name: "Alice",
      email: "alice@example.com",
      password: "AlicePass123!",
    });
    expect(signupRes.status).toBe(201);
    expect(signupRes.body).toMatchObject({
      email: "alice@example.com",
      role: "user",
    });
    expect(signupRes.body.passwordHash).toBeUndefined();

    const meRes = await agent.get("/api/v1/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe("alice@example.com");

    const refreshRes = await agent.post("/api/v1/auth/refresh");
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.email).toBe("alice@example.com");

    const logoutRes = await agent.post("/api/v1/auth/logout");
    expect(logoutRes.status).toBe(204);

    // The refresh token was rotated on logout (tokenVersion bump) — a stale refresh must now fail.
    const staleRefreshRes = await agent.post("/api/v1/auth/refresh");
    expect(staleRefreshRes.status).toBe(401);
  });

  it("rejects login with the wrong password", async () => {
    await request(app).post("/api/v1/auth/signup").send({
      name: "Bob",
      email: "bob@example.com",
      password: "BobPass123!",
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects an invalid/garbage refresh token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", ["refreshToken=invalid.garbage.token"]);

    expect(res.status).toBe(401);
  });

  it("rejects a request with no auth cookie at all", async () => {
    const res = await request(app).get("/api/v1/me");
    expect(res.status).toBe(401);
  });
});

describe("RBAC", () => {
  it("rejects a regular user creating a movie (admin-only)", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/signup").send({
      name: "Regular User",
      email: "regular@example.com",
      password: "RegularPass123!",
    });

    const res = await agent.post("/api/v1/movies").send({
      title: "Should Fail",
      description: "x",
      durationMinutes: 90,
      genres: ["Drama"],
      language: "English",
      releaseDate: "2026-01-01",
    });

    expect(res.status).toBe(403);
  });
});
