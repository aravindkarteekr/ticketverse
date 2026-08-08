import type { LoginInput } from "@ticketverse/schemas";
import { UnauthorizedError } from "../../../shared/errors/AppError.js";
import { comparePassword } from "../../../shared/lib/password.js";
import type { UserRepository } from "../domain/ports/UserRepository.js";
import type { UserEntity } from "../domain/User.js";

export function makeLogin(userRepo: UserRepository) {
  return async function login(input: LoginInput): Promise<UserEntity> {
    const user = await userRepo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return user;
  };
}
