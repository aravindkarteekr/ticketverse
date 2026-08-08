import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ValidationError } from "../errors/AppError.js";

type Target = "body" | "query" | "params";

/** Parses req[target] through a shared Zod schema, replacing it with the coerced/typed result. */
export function validate(schema: ZodTypeAny, target: Target = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      throw new ValidationError("Invalid request data", result.error.flatten());
    }
    req[target] = result.data;
    next();
  };
}
