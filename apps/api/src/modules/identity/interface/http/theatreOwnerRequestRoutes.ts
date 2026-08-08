import { Router } from "express";
import {
  createTheatreOwnerRequestSchema,
  paginationQuerySchema,
  reviewTheatreOwnerRequestSchema,
  objectIdSchema,
} from "@ticketverse/schemas";
import { z } from "zod";
import { validate } from "../../../../shared/middleware/validate.js";
import { authenticate } from "../../../../shared/middleware/authenticate.js";
import { requireRole } from "../../../../shared/middleware/requireRole.js";
import { asyncHandler } from "../../../../shared/middleware/asyncHandler.js";
import { MongoUserRepository } from "../../infrastructure/MongoUserRepository.js";
import { MongoTheatreOwnerRequestRepository } from "../../infrastructure/MongoTheatreOwnerRequestRepository.js";
import { makeRequestTheatreOwner } from "../../application/requestTheatreOwner.js";
import { makeReviewTheatreOwnerRequest } from "../../application/reviewTheatreOwnerRequest.js";
import { makeListUsers } from "../../application/listUsers.js";
import type { TheatreProvisioningPort } from "../../domain/ports/TheatreProvisioningPort.js";

const paramsSchema = z.object({ id: objectIdSchema });

export function createTheatreOwnerRequestRouter(theatreProvisioning: TheatreProvisioningPort): Router {
  const userRepo = new MongoUserRepository();
  const requestRepo = new MongoTheatreOwnerRequestRepository();
  const requestTheatreOwner = makeRequestTheatreOwner(requestRepo);
  const reviewTheatreOwnerRequest = makeReviewTheatreOwnerRequest(
    requestRepo,
    userRepo,
    theatreProvisioning,
  );
  const listUsers = makeListUsers(userRepo);

  const router = Router();

  router.post(
    "/theatre-owner-requests",
    authenticate,
    requireRole("user"),
    validate(createTheatreOwnerRequestSchema),
    asyncHandler(async (req, res) => {
      const request = await requestTheatreOwner(req.user!.id, req.body);
      res.status(201).json(request);
    }),
  );

  router.post(
    "/theatre-owner-requests/:id/review",
    authenticate,
    requireRole("admin"),
    validate(paramsSchema, "params"),
    validate(reviewTheatreOwnerRequestSchema),
    asyncHandler(async (req, res) => {
      const { id } = req.params as { id: string };
      await reviewTheatreOwnerRequest(id, req.body);
      res.status(204).send();
    }),
  );

  router.get(
    "/admin/users",
    authenticate,
    requireRole("admin"),
    validate(paginationQuerySchema, "query"),
    asyncHandler(async (req, res) => {
      const result = await listUsers(req.query as never);
      res.json(result);
    }),
  );

  return router;
}
