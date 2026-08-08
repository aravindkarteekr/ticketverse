import { NotFoundError } from "../../../shared/errors/AppError.js";
import type { UserRepository } from "../domain/ports/UserRepository.js";
import type { UserEntity } from "../domain/User.js";

export function makeGetMe(userRepo: UserRepository) {
  return async function getMe(userId: string): Promise<UserEntity> {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  };
}
