import type { Router } from "express";
import type { ShowLookupPort } from "./domain/ports/ShowLookupPort.js";
import type { ScreenLookupPort } from "./domain/ports/ScreenLookupPort.js";
import { createBookingRouter } from "./interface/http/bookingRoutes.js";

export function createBookingModuleRouter(showLookup: ShowLookupPort, screenLookup: ScreenLookupPort): Router {
  return createBookingRouter(showLookup, screenLookup);
}

export type { ShowLookupPort, ScreenLookupPort };
