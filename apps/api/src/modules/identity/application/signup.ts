import type { SignupInput } from "@ticketverse/schemas";
import { ConflictError } from "../../../shared/errors/AppError.js";
import { hashPassword } from "../../../shared/lib/password.js";
import type { UserRepository } from "../domain/ports/UserRepository.js";
import type { UserEntity } from "../domain/User.js";

export function makeSignup(userRepo: UserRepository) {
  return async function signup(input: SignupInput): Promise<UserEntity> {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email already in use");
    }

    const passwordHash = await hashPassword(input.password);
    return userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "user",
    });
  };
}
