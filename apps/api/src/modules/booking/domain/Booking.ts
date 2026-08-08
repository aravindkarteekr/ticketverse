import type { BookingStatus } from "@ticketverse/schemas";

export interface BookingEntity {
  id: string;
  userId: string;
  showId: string;
  seatIds: string[];
  status: BookingStatus;
  totalAmount: number;
  holdId: string;
  createdAt: Date;
}

export type NewBooking = Omit<BookingEntity, "id" | "createdAt">;
