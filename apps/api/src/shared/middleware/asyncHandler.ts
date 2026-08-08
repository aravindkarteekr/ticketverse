import type { NextFunction, Request, Response } from "express";

/** Wraps async route handlers so rejected promises reach errorHandler via next(). */
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<void>>(
  fn: T,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
