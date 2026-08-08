import { z } from "zod";
import { objectIdSchema } from "./common.schema.js";

export const createMovieSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  durationMinutes: z.coerce.number().int().min(1).max(1000),
  genres: z.array(z.string().trim().min(1)).min(1),
  language: z.string().trim().min(1).max(50),
  releaseDate: z.coerce.date(),
  posterUrl: z.string().url().optional(),
});
export type CreateMovieInput = z.infer<typeof createMovieSchema>;

export const updateMovieSchema = createMovieSchema.partial();
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;

export const movieSchema = createMovieSchema.extend({
  id: objectIdSchema,
  createdAt: z.coerce.date(),
});
export type Movie = z.infer<typeof movieSchema>;

export const movieSearchQuerySchema = z.object({
  q: z.string().trim().optional(),
  genre: z.string().trim().optional(),
  language: z.string().trim().optional(),
});
export type MovieSearchQuery = z.infer<typeof movieSearchQuerySchema>;
