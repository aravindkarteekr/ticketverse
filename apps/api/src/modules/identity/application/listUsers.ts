import type { PaginationQuery } from "@ticketverse/schemas";
import type { UserRepository } from "../domain/ports/UserRepository.js";

/** Admin oversight — list all users. */
export function makeListUsers(userRepo: UserRepository) {
  return async function listUsers(query: PaginationQuery) {
    return userRepo.list(query);
  };
}
