import type { PaginationQuery } from "@ticketverse/schemas";
import type { UserRepository } from "../domain/ports/UserRepository.js";

/** Admin oversight — list all users. Strips passwordHash/tokenVersion before returning. */
export function makeListUsers(userRepo: UserRepository) {
  return async function listUsers(query: PaginationQuery) {
    const { items, total } = await userRepo.list(query);
    return {
      items: items.map(({ id, name, email, role, createdAt }) => ({ id, name, email, role, createdAt })),
      total,
    };
  };
}
