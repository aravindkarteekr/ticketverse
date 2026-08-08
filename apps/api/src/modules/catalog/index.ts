import { Router } from "express";
import { movieRouter } from "./interface/http/movieRoutes.js";

export function createCatalogRouter(): Router {
  const router = Router();
  router.use(movieRouter);
  return router;
}
