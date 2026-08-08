import { Router } from "express";
import { theatreRouter } from "./interface/http/theatreRoutes.js";
import { screenRouter } from "./interface/http/screenRoutes.js";
import { MongoTheatreRepository } from "./infrastructure/MongoTheatreRepository.js";
import { TheatreProvisioningAdapter } from "./infrastructure/TheatreProvisioningAdapter.js";
import type { TheatreProvisioningPort } from "../identity/domain/ports/TheatreProvisioningPort.js";

export function createTheatreRouter(): Router {
  const router = Router();
  router.use(theatreRouter);
  router.use(screenRouter);
  return router;
}

/** Real theatre-provisioning implementation, wired into the identity module at composition root. */
export function createTheatreProvisioningPort(): TheatreProvisioningPort {
  return new TheatreProvisioningAdapter(new MongoTheatreRepository());
}
