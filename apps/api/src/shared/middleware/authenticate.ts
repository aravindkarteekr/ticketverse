import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/AppError.js";
import { verifyAccessToken } from "../lib/jwt.js";

/** Verifies the access-token cookie and attaches `req.user`. Real RBAC enforcement lives here + requireRole. */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) {
    throw new UnauthorizedError("Missing access token");
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}
