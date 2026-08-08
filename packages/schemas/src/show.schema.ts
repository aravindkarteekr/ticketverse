import { z } from "zod";
import { objectIdSchema } from "./common.schema.js";
import { seatTypeSchema } from "./theatre.schema.js";

export const seatPricingSchema = z.object({
  seatType: seatTypeSchema,
  price: z.coerce.number().positive(),
});
export type SeatPricing = z.infer<typeof seatPricingSchema>;

export const createShowSchema = z.object({
  movieId: objectIdSchema,
  screenId: objectIdSchema,
  startTime: z.coerce.date(),
  pricing: z.array(seatPricingSchema).min(1),
});
export type CreateShowInput = z.infer<typeof createShowSchema>;

export const updateShowSchema = createShowSchema.partial();
export type UpdateShowInput = z.infer<typeof updateShowSchema>;

export const showSchema = createShowSchema.extend({
  id: objectIdSchema,
  theatreId: objectIdSchema,
  createdAt: z.coerce.date(),
});
export type Show = z.infer<typeof showSchema>;

export const showSearchQuerySchema = z.object({
  movieId: objectIdSchema.optional(),
  city: z.string().trim().optional(),
  date: z.coerce.date().optional(),
});
export type ShowSearchQuery = z.infer<typeof showSearchQuerySchema>;
