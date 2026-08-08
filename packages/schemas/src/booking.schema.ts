import { z } from "zod";
import { objectIdSchema } from "./common.schema.js";

export const bookingStatusSchema = z.enum([
  "pending_payment",
  "confirmed",
  "expired",
  "cancelled",
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const seatIdSchema = z.string().trim().min(1).max(10);

export const holdSeatsSchema = z.object({
  showId: objectIdSchema,
  seatIds: z.array(seatIdSchema).min(1).max(10),
});
export type HoldSeatsInput = z.infer<typeof holdSeatsSchema>;

export const holdSeatsResponseSchema = z.object({
  holdId: z.string(),
  unavailableSeatIds: z.array(seatIdSchema),
  expiresAt: z.coerce.date(),
});
export type HoldSeatsResponse = z.infer<typeof holdSeatsResponseSchema>;

export const createBookingSchema = z.object({
  showId: objectIdSchema,
  holdId: z.string(),
  seatIds: z.array(seatIdSchema).min(1).max(10),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const bookingSchema = z.object({
  id: objectIdSchema,
  userId: objectIdSchema,
  showId: objectIdSchema,
  seatIds: z.array(seatIdSchema),
  status: bookingStatusSchema,
  totalAmount: z.number().positive(),
  createdAt: z.coerce.date(),
});
export type Booking = z.infer<typeof bookingSchema>;

export const seatAvailabilitySchema = z.object({
  seatId: seatIdSchema,
  seatType: z.string(),
  price: z.number().positive(),
  status: z.enum(["available", "held", "booked"]),
});
export type SeatAvailability = z.infer<typeof seatAvailabilitySchema>;
