import type { Role } from "@ticketverse/schemas";

/** Domain entity — framework-agnostic shape of a persisted user. */
export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  tokenVersion: number;
  createdAt: Date;
}

export type NewUser = Omit<UserEntity, "id" | "createdAt" | "tokenVersion">;
