import type { Router } from "express";
import type { TheatreLookupPort } from "./domain/ports/TheatreLookupPort.js";
import { createShowRouter } from "./interface/http/showRoutes.js";

export function createShowModuleRouter(theatreLookup: TheatreLookupPort): Router {
  return createShowRouter(theatreLookup);
}

export type { TheatreLookupPort };
