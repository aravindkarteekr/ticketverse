import { z } from "zod";
import { objectIdSchema } from "./common.schema.js";

export const seatTypeSchema = z.enum(["regular", "premium", "recliner"]);
export type SeatType = z.infer<typeof seatTypeSchema>;

export const seatLayoutRowSchema = z.object({
  row: z.string().trim().min(1).max(5),
  seatCount: z.coerce.number().int().min(1).max(100),
  seatType: seatTypeSchema,
});
export type SeatLayoutRow = z.infer<typeof seatLayoutRowSchema>;

export const createScreenSchema = z.object({
  name: z.string().trim().min(1).max(100),
  layout: z.array(seatLayoutRowSchema).min(1),
});
export type CreateScreenInput = z.infer<typeof createScreenSchema>;

export const screenSchema = createScreenSchema.extend({
  id: objectIdSchema,
  theatreId: objectIdSchema,
});
export type Screen = z.infer<typeof screenSchema>;

export const createTheatreSchema = z.object({
  name: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(300),
});
export type CreateTheatreInput = z.infer<typeof createTheatreSchema>;

export const updateTheatreSchema = createTheatreSchema.partial();
export type UpdateTheatreInput = z.infer<typeof updateTheatreSchema>;

export const theatreSchema = createTheatreSchema.extend({
  id: objectIdSchema,
  ownerId: objectIdSchema,
  createdAt: z.coerce.date(),
});
export type Theatre = z.infer<typeof theatreSchema>;
