import { Router } from "express";
import { z } from "zod";
import {
  createShowSchema,
  updateShowSchema,
  showSearchQuerySchema,
  paginationQuerySchema,
  objectIdSchema,
} from "@ticketverse/schemas";
import { validate } from "../../../../shared/middleware/validate.js";
import { authenticate } from "../../../../shared/middleware/authenticate.js";
import { requireRole } from "../../../../shared/middleware/requireRole.js";
import { asyncHandler } from "../../../../shared/middleware/asyncHandler.js";
import { MongoShowRepository } from "../../infrastructure/MongoShowRepository.js";
import type { TheatreLookupPort } from "../../domain/ports/TheatreLookupPort.js";
import {
  makeCreateShow,
  makeDeleteShow,
  makeGetShow,
  makeListShowsByTheatre,
  makeSearchShows,
  makeUpdateShow,
} from "../../application/showUseCases.js";

const paramsSchema = z.object({ id: objectIdSchema });
const theatreParamsSchema = z.object({ theatreId: objectIdSchema });
const searchQuerySchema = showSearchQuerySchema.merge(paginationQuerySchema);

export function createShowRouter(theatreLookup: TheatreLookupPort): Router {
  const showRepo = new MongoShowRepository();
  const createShow = makeCreateShow(showRepo, theatreLookup);
  const updateShow = makeUpdateShow(showRepo, theatreLookup);
  const deleteShow = makeDeleteShow(showRepo, theatreLookup);
  const getShow = makeGetShow(showRepo);
  const searchShows = makeSearchShows(showRepo, theatreLookup);
  const listShowsByTheatre = makeListShowsByTheatre(showRepo);

  const router = Router();

  router.get(
    "/shows",
    validate(searchQuerySchema, "query"),
    asyncHandler(async (req, res) => {
      const query = req.query as unknown as z.infer<typeof searchQuerySchema>;
      const result = await searchShows(query);
      res.json(result);
    }),
  );

  router.get(
    "/theatres/:theatreId/shows",
    validate(theatreParamsSchema, "params"),
    asyncHandler(async (req, res) => {
      const shows = await listShowsByTheatre(
        (req.params as { theatreId: string }).theatreId,
      );
      res.json(shows);
    }),
  );

  router.get(
    "/shows/:id",
    validate(paramsSchema, "params"),
    asyncHandler(async (req, res) => {
      const show = await getShow((req.params as { id: string }).id);
      res.json(show);
    }),
  );

  router.post(
    "/shows",
    authenticate,
    requireRole("theatre_owner"),
    validate(createShowSchema),
    asyncHandler(async (req, res) => {
      const show = await createShow(req.user!.id, req.body);
      res.status(201).json(show);
    }),
  );

  router.patch(
    "/shows/:id",
    authenticate,
    requireRole("theatre_owner"),
    validate(paramsSchema, "params"),
    validate(updateShowSchema),
    asyncHandler(async (req, res) => {
      const show = await updateShow(
        (req.params as { id: string }).id,
        req.user!.id,
        req.body,
      );
      res.json(show);
    }),
  );

  router.delete(
    "/shows/:id",
    authenticate,
    requireRole("theatre_owner"),
    validate(paramsSchema, "params"),
    asyncHandler(async (req, res) => {
      await deleteShow((req.params as { id: string }).id, req.user!.id);
      res.status(204).send();
    }),
  );

  return router;
}
