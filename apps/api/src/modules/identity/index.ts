import { Router } from "express";
import { authRouter } from "./interface/http/authRoutes.js";
import { createTheatreOwnerRequestRouter } from "./interface/http/theatreOwnerRequestRoutes.js";
import type { TheatreProvisioningPort } from "./domain/ports/TheatreProvisioningPort.js";

export function createIdentityRouter(theatreProvisioning: TheatreProvisioningPort): Router {
  const router = Router();
  router.use(authRouter);
  router.use(createTheatreOwnerRequestRouter(theatreProvisioning));
  return router;
}

export type { TheatreProvisioningPort } from "./domain/ports/TheatreProvisioningPort.js";
