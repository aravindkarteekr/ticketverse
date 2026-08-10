import { describe, expect, it } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../src/shared/lib/jwt.js";

describe("jwt access/refresh tokens", () => {
  it("issues an access token that round-trips its payload", () => {
    const token = signAccessToken({ sub: "user-1", role: "user" });
    const decoded = verifyAccessToken(token);

    expect(decoded.sub).toBe("user-1");
    expect(decoded.role).toBe("user");
  });

  it("issues a refresh token that round-trips its payload", () => {
    const token = signRefreshToken({ sub: "user-1", tokenVersion: 0 });
    const decoded = verifyRefreshToken(token);

    expect(decoded.sub).toBe("user-1");
    expect(decoded.tokenVersion).toBe(0);
  });

  it("rejects a tampered access token", () => {
    const token = signAccessToken({ sub: "user-1", role: "admin" });
    const tampered = token.slice(0, -2) + "xx";

    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("rejects an access token verified against the wrong secret (refresh secret)", () => {
    const token = signAccessToken({ sub: "user-1", role: "user" });

    expect(() => verifyRefreshToken(token)).toThrow();
  });
});
