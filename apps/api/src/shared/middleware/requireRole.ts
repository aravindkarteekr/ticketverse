import type { NextFunction, Request, Response } from "express";
import type { Role } from "@ticketverse/schemas";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";

/** Must run after `authenticate`. Enforces role membership from the verified JWT payload. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires role: ${roles.join(" or ")}`);
    }
    next();
  };
}
