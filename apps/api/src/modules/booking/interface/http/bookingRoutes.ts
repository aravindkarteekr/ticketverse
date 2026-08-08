import { Router } from "express";
import { z } from "zod";
import {
  holdSeatsSchema,
  createBookingSchema,
  paginationQuerySchema,
  objectIdSchema,
} from "@ticketverse/schemas";
import { ForbiddenError } from "../../../../shared/errors/AppError.js";
import { validate } from "../../../../shared/middleware/validate.js";
import { authenticate } from "../../../../shared/middleware/authenticate.js";
import { requireRole } from "../../../../shared/middleware/requireRole.js";
import { asyncHandler } from "../../../../shared/middleware/asyncHandler.js";
import { MongoBookingRepository } from "../../infrastructure/MongoBookingRepository.js";
import { RedisSeatHoldAdapter } from "../../infrastructure/RedisSeatHoldAdapter.js";
import { redis } from "../../../../shared/lib/redis.js";
import type { ShowLookupPort } from "../../domain/ports/ShowLookupPort.js";
import type { ScreenLookupPort } from "../../domain/ports/ScreenLookupPort.js";
import {
  makeCreateBooking,
  makeGetBooking,
  makeGetSeatAvailability,
  makeHoldSeats,
  makeListAllBookings,
  makeListMyBookings,
} from "../../application/bookingUseCases.js";

const showParamsSchema = z.object({ showId: objectIdSchema });
const bookingParamsSchema = z.object({ id: objectIdSchema });

export function createBookingRouter(showLookup: ShowLookupPort, screenLookup: ScreenLookupPort): Router {
  const bookingRepo = new MongoBookingRepository();
  const seatHold = new RedisSeatHoldAdapter(redis);

  const getSeatAvailability = makeGetSeatAvailability(bookingRepo, showLookup, screenLookup, seatHold);
  const holdSeats = makeHoldSeats(seatHold, showLookup);
  const createBooking = makeCreateBooking(bookingRepo, showLookup, screenLookup, seatHold);
  const getBooking = makeGetBooking(bookingRepo);
  const listMyBookings = makeListMyBookings(bookingRepo);
  const listAllBookings = makeListAllBookings(bookingRepo);

  const router = Router();

  router.get(
    "/shows/:showId/seats",
    validate(showParamsSchema, "params"),
    asyncHandler(async (req, res) => {
      const seats = await getSeatAvailability((req.params as { showId: string }).showId);
      res.json(seats);
    }),
  );

  router.post(
    "/bookings/hold",
    authenticate,
    validate(holdSeatsSchema),
    asyncHandler(async (req, res) => {
      const { showId, seatIds } = req.body as { showId: string; seatIds: string[] };
      const result = await holdSeats(showId, seatIds);
      res.status(result.unavailableSeatIds.length > 0 ? 409 : 201).json(result);
    }),
  );

  router.post(
    "/bookings",
    authenticate,
    validate(createBookingSchema),
    asyncHandler(async (req, res) => {
      const { showId, holdId, seatIds } = req.body as {
        showId: string;
        holdId: string;
        seatIds: string[];
      };
      const booking = await createBooking(req.user!.id, showId, holdId, seatIds);
      res.status(201).json(booking);
    }),
  );

  router.get(
    "/bookings/mine",
    authenticate,
    validate(paginationQuerySchema, "query"),
    asyncHandler(async (req, res) => {
      const result = await listMyBookings(req.user!.id, req.query as never);
      res.json(result);
    }),
  );

  router.get(
    "/admin/bookings",
    authenticate,
    requireRole("admin"),
    validate(paginationQuerySchema, "query"),
    asyncHandler(async (req, res) => {
      const result = await listAllBookings(req.query as never);
      res.json(result);
    }),
  );

  router.get(
    "/bookings/:id",
    authenticate,
    validate(bookingParamsSchema, "params"),
    asyncHandler(async (req, res) => {
      const booking = await getBooking((req.params as { id: string }).id);
      if (booking.userId !== req.user!.id && req.user!.role !== "admin") {
        throw new ForbiddenError("You cannot view this booking");
      }
      res.json(booking);
    }),
  );

  return router;
}
