import type { Role } from "@ticketverse/schemas";
import type { NewUser, UserEntity } from "../User.js";

/** Repository port — infrastructure provides the Mongoose-backed implementation. */
export interface UserRepository {
  create(user: NewUser): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  updateRole(id: string, role: Role): Promise<void>;
  incrementTokenVersion(id: string): Promise<void>;
  list(params: {
    page: number;
    limit: number;
  }): Promise<{ items: UserEntity[]; total: number }>;
}
