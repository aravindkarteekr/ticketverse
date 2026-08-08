import type { UserRepository } from "../domain/ports/UserRepository.js";

/** Bumps tokenVersion so all previously issued refresh tokens are rejected ("logout everywhere"). */
export function makeLogoutAll(userRepo: UserRepository) {
  return async function logoutAll(userId: string): Promise<void> {
    await userRepo.incrementTokenVersion(userId);
  };
}
