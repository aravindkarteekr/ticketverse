import { UnauthorizedError } from "../../../shared/errors/AppError.js";
import { verifyRefreshToken } from "../../../shared/lib/jwt.js";
import type { UserRepository } from "../domain/ports/UserRepository.js";
import type { UserEntity } from "../domain/User.js";

/** Verifies the refresh token + tokenVersion, returning the still-valid user for token rotation. */
export function makeRefreshTokens(userRepo: UserRepository) {
  return async function refreshTokens(
    refreshToken: string,
  ): Promise<UserEntity> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const user = await userRepo.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedError("Refresh token has been revoked");
    }

    return user;
  };
}
