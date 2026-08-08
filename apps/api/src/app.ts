import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import { env } from "./shared/config/env.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { router } from "./routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(mongoSanitize());

  // Stricter limiter on auth endpoints to blunt brute-force login/signup attempts.
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
  app.use("/api/v1/auth", authLimiter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1", router);

  app.use(errorHandler);

  return app;
}
