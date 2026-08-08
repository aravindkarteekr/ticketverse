import { Router } from "express";
import { createIdentityRouter } from "./modules/identity/index.js";
import { createCatalogRouter } from "./modules/catalog/index.js";
import {
  createTheatreRouter,
  createTheatreProvisioningPort,
  createTheatreLookupPort,
  createScreenLookupPort,
} from "./modules/theatre/index.js";
import { createShowModuleRouter, createShowLookupPort } from "./modules/show/index.js";
import { createBookingModuleRouter } from "./modules/booking/index.js";

/** Aggregate router — each module step mounts its own router here as it's built. */
export const router = Router();
router.use(createIdentityRouter(createTheatreProvisioningPort()));
router.use(createCatalogRouter());
router.use(createTheatreRouter());
router.use(createShowModuleRouter(createTheatreLookupPort()));
router.use(createBookingModuleRouter(createShowLookupPort(), createScreenLookupPort()));
