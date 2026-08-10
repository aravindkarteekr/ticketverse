import { Router } from "express";
import { z } from "zod";
import { createScreenSchema, objectIdSchema } from "@ticketverse/schemas";
import { validate } from "../../../../shared/middleware/validate.js";
import { authenticate } from "../../../../shared/middleware/authenticate.js";
import { requireRole } from "../../../../shared/middleware/requireRole.js";
import { asyncHandler } from "../../../../shared/middleware/asyncHandler.js";
import { MongoScreenRepository } from "../../infrastructure/MongoScreenRepository.js";
import { MongoTheatreRepository } from "../../infrastructure/MongoTheatreRepository.js";
import {
  makeCreateScreen,
  makeDeleteScreen,
  makeListScreens,
} from "../../application/screenUseCases.js";

const theatreParamsSchema = z.object({ theatreId: objectIdSchema });
const screenParamsSchema = z.object({ id: objectIdSchema });

const screenRepo = new MongoScreenRepository();
const theatreRepo = new MongoTheatreRepository();
const createScreen = makeCreateScreen(screenRepo, theatreRepo);
const listScreens = makeListScreens(screenRepo);
const deleteScreen = makeDeleteScreen(screenRepo, theatreRepo);

export const screenRouter = Router();

screenRouter.get(
  "/theatres/:theatreId/screens",
  validate(theatreParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const screens = await listScreens(
      (req.params as { theatreId: string }).theatreId,
    );
    res.json(screens);
  }),
);

screenRouter.post(
  "/theatres/:theatreId/screens",
  authenticate,
  requireRole("theatre_owner"),
  validate(theatreParamsSchema, "params"),
  validate(createScreenSchema),
  asyncHandler(async (req, res) => {
    const screen = await createScreen(
      (req.params as { theatreId: string }).theatreId,
      req.user!.id,
      req.body,
    );
    res.status(201).json(screen);
  }),
);

screenRouter.delete(
  "/screens/:id",
  authenticate,
  requireRole("theatre_owner"),
  validate(screenParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    await deleteScreen((req.params as { id: string }).id, req.user!.id);
    res.status(204).send();
  }),
);
