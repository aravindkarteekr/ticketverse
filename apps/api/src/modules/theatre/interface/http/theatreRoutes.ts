import { Router } from "express";
import { z } from "zod";
import { updateTheatreSchema, paginationQuerySchema, objectIdSchema } from "@ticketverse/schemas";
import { validate } from "../../../../shared/middleware/validate.js";
import { authenticate } from "../../../../shared/middleware/authenticate.js";
import { requireRole } from "../../../../shared/middleware/requireRole.js";
import { asyncHandler } from "../../../../shared/middleware/asyncHandler.js";
import { MongoTheatreRepository } from "../../infrastructure/MongoTheatreRepository.js";
import {
  makeGetTheatre,
  makeListAllTheatres,
  makeListMyTheatres,
  makeUpdateTheatre,
} from "../../application/theatreUseCases.js";

const paramsSchema = z.object({ id: objectIdSchema });

const theatreRepo = new MongoTheatreRepository();
const getTheatre = makeGetTheatre(theatreRepo);
const listMyTheatres = makeListMyTheatres(theatreRepo);
const listAllTheatres = makeListAllTheatres(theatreRepo);
const updateTheatre = makeUpdateTheatre(theatreRepo);

export const theatreRouter = Router();

theatreRouter.get(
  "/theatres/mine",
  authenticate,
  requireRole("theatre_owner"),
  asyncHandler(async (req, res) => {
    const theatres = await listMyTheatres(req.user!.id);
    res.json(theatres);
  }),
);

// Admin oversight — list every theatre in the system.
theatreRouter.get(
  "/admin/theatres",
  authenticate,
  requireRole("admin"),
  validate(paginationQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const result = await listAllTheatres(req.query as never);
    res.json(result);
  }),
);

theatreRouter.get(
  "/theatres/:id",
  validate(paramsSchema, "params"),
  asyncHandler(async (req, res) => {
    const theatre = await getTheatre((req.params as { id: string }).id);
    res.json(theatre);
  }),
);

theatreRouter.patch(
  "/theatres/:id",
  authenticate,
  requireRole("theatre_owner"),
  validate(paramsSchema, "params"),
  validate(updateTheatreSchema),
  asyncHandler(async (req, res) => {
    const theatre = await updateTheatre((req.params as { id: string }).id, req.user!.id, req.body);
    res.json(theatre);
  }),
);
