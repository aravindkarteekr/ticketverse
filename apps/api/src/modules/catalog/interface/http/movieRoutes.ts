import { Router } from "express";
import { z } from "zod";
import {
  createMovieSchema,
  updateMovieSchema,
  movieSearchQuerySchema,
  paginationQuerySchema,
  objectIdSchema,
} from "@ticketverse/schemas";
import { validate } from "../../../../shared/middleware/validate.js";
import { authenticate } from "../../../../shared/middleware/authenticate.js";
import { requireRole } from "../../../../shared/middleware/requireRole.js";
import { asyncHandler } from "../../../../shared/middleware/asyncHandler.js";
import { MongoMovieRepository } from "../../infrastructure/MongoMovieRepository.js";
import {
  makeCreateMovie,
  makeDeleteMovie,
  makeGetMovie,
  makeSearchMovies,
  makeUpdateMovie,
} from "../../application/movieUseCases.js";

const paramsSchema = z.object({ id: objectIdSchema });
const searchQuerySchema = movieSearchQuerySchema.merge(paginationQuerySchema);

const movieRepo = new MongoMovieRepository();
const createMovie = makeCreateMovie(movieRepo);
const updateMovie = makeUpdateMovie(movieRepo);
const deleteMovie = makeDeleteMovie(movieRepo);
const getMovie = makeGetMovie(movieRepo);
const searchMovies = makeSearchMovies(movieRepo);

export const movieRouter = Router();

// Public read endpoints
movieRouter.get(
  "/movies",
  validate(searchQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const result = await searchMovies(req.query as never);
    res.json(result);
  }),
);

movieRouter.get(
  "/movies/:id",
  validate(paramsSchema, "params"),
  asyncHandler(async (req, res) => {
    const movie = await getMovie((req.params as { id: string }).id);
    res.json(movie);
  }),
);

// Admin-only write endpoints — theatre owners cannot create movies, only schedule shows.
movieRouter.post(
  "/movies",
  authenticate,
  requireRole("admin"),
  validate(createMovieSchema),
  asyncHandler(async (req, res) => {
    const movie = await createMovie(req.body);
    res.status(201).json(movie);
  }),
);

movieRouter.patch(
  "/movies/:id",
  authenticate,
  requireRole("admin"),
  validate(paramsSchema, "params"),
  validate(updateMovieSchema),
  asyncHandler(async (req, res) => {
    const movie = await updateMovie((req.params as { id: string }).id, req.body);
    res.json(movie);
  }),
);

movieRouter.delete(
  "/movies/:id",
  authenticate,
  requireRole("admin"),
  validate(paramsSchema, "params"),
  asyncHandler(async (req, res) => {
    await deleteMovie((req.params as { id: string }).id);
    res.status(204).send();
  }),
);
