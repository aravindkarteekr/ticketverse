import type { Router } from "express";
import type { TheatreLookupPort } from "./domain/ports/TheatreLookupPort.js";
import type { ShowLookupPort } from "../booking/domain/ports/ShowLookupPort.js";
import { createShowRouter } from "./interface/http/showRoutes.js";
import { ShowLookupAdapter } from "./infrastructure/ShowLookupAdapter.js";

export function createShowModuleRouter(theatreLookup: TheatreLookupPort): Router {
  return createShowRouter(theatreLookup);
}

/** Real show-lookup implementation, wired into the booking module at composition root. */
export function createShowLookupPort(): ShowLookupPort {
  return new ShowLookupAdapter();
}

export type { TheatreLookupPort };
