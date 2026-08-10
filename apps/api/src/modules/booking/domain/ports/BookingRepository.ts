import type { BookingStatus } from "@ticketverse/schemas";
import type { BookingEntity, NewBooking } from "../Booking.js";

export interface BookingRepository {
  create(booking: NewBooking): Promise<BookingEntity>;
  findById(id: string): Promise<BookingEntity | null>;
  findByUserId(
    userId: string,
    params: { page: number; limit: number },
  ): Promise<{
    items: BookingEntity[];
    total: number;
  }>;
  list(params: {
    page: number;
    limit: number;
  }): Promise<{ items: BookingEntity[]; total: number }>;
  updateStatus(
    id: string,
    status: BookingStatus,
  ): Promise<BookingEntity | null>;
  /** Seat ids already permanently booked (status=confirmed) for a show. */
  findBookedSeatIds(showId: string): Promise<string[]>;
}
