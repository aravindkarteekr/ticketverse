import type { TheatreOwnerRequestStatus } from "@ticketverse/schemas";

/** Domain entity — a user's request to become a theatre owner, reviewed by an admin. */
export interface TheatreOwnerRequestEntity {
  id: string;
  userId: string;
  theatreName: string;
  city: string;
  reason?: string;
  status: TheatreOwnerRequestStatus;
  createdAt: Date;
}

export type NewTheatreOwnerRequest = Pick<
  TheatreOwnerRequestEntity,
  "userId" | "theatreName" | "city" | "reason"
>;
