import { Router } from "express";
import { loginSchema, signupSchema } from "@ticketverse/schemas";
import { validate } from "../../../../shared/middleware/validate.js";
import { authenticate } from "../../../../shared/middleware/authenticate.js";
import { asyncHandler } from "../../../../shared/middleware/asyncHandler.js";
import { UnauthorizedError } from "../../../../shared/errors/AppError.js";
import { MongoUserRepository } from "../../infrastructure/MongoUserRepository.js";
import { makeSignup } from "../../application/signup.js";
import { makeLogin } from "../../application/login.js";
import { makeRefreshTokens } from "../../application/refreshTokens.js";
import { makeLogoutAll } from "../../application/logout.js";
import { makeGetMe } from "../../application/getMe.js";
import { setAuthCookies, clearAuthCookies } from "./cookies.js";

const userRepo = new MongoUserRepository();
const signup = makeSignup(userRepo);
const login = makeLogin(userRepo);
const refreshTokens = makeRefreshTokens(userRepo);
const logoutAll = makeLogoutAll(userRepo);
const getMe = makeGetMe(userRepo);

export const authRouter = Router();

authRouter.post(
  "/auth/signup",
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const user = await signup(req.body);
    setAuthCookies(res, user);
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  }),
);

authRouter.post(
  "/auth/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await login(req.body);
    setAuthCookies(res, user);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  }),
);

authRouter.post(
  "/auth/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedError("Missing refresh token");
    }
    const user = await refreshTokens(refreshToken);
    setAuthCookies(res, user);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  }),
);

authRouter.post(
  "/auth/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    await logoutAll(req.user!.id);
    clearAuthCookies(res);
    res.status(204).send();
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await getMe(req.user!.id);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  }),
);
