import type { Response } from "express";
import { env } from "../../../../shared/config/env.js";
import { signAccessToken, signRefreshToken } from "../../../../shared/lib/jwt.js";
import type { UserEntity } from "../../domain/User.js";

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Issues fresh access+refresh JWTs and sets them as httpOnly cookies (never touched by JS). */
export function setAuthCookies(res: Response, user: Pick<UserEntity, "id" | "role" | "tokenVersion">) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });

  const cookieOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? ("none" as const) : ("lax" as const),
  };

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE_MS });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE_MS });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
}
