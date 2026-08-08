import { Router } from "express";
import { createIdentityRouter } from "./modules/identity/index.js";
import type { TheatreProvisioningPort } from "./modules/identity/domain/ports/TheatreProvisioningPort.js";

/**
 * Stub until the `theatre` module exists (Phase 2 step 7), which will supply the real
 * implementation that actually creates a Theatre document for the newly approved owner.
 */
const pendingTheatreProvisioning: TheatreProvisioningPort = {
  async provisionTheatreForOwner() {
    console.warn("TheatreProvisioningPort not yet wired — theatre module pending (step 7)");
  },
};

/** Aggregate router — each module step mounts its own router here as it's built. */
export const router = Router();
router.use(createIdentityRouter(pendingTheatreProvisioning));
