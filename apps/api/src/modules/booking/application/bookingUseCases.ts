import { randomUUID } from "node:crypto";
import type { SeatAvailability } from "@ticketverse/schemas";
import {
  ConflictError,
  NotFoundError,
} from "../../../shared/errors/AppError.js";
import { expandSeatLayout } from "../domain/seatLayout.js";
import type { BookingRepository } from "../domain/ports/BookingRepository.js";
import type { ShowLookupPort } from "../domain/ports/ShowLookupPort.js";
import type { ScreenLookupPort } from "../domain/ports/ScreenLookupPort.js";
import type { SeatHoldPort } from "../domain/ports/SeatHoldPort.js";

const HOLD_TTL_SECONDS = 5 * 60;

export function makeGetSeatAvailability(
  bookingRepo: BookingRepository,
  showLookup: ShowLookupPort,
  screenLookup: ScreenLookupPort,
  seatHold: SeatHoldPort,
) {
  return async (showId: string): Promise<SeatAvailability[]> => {
    const show = await showLookup.getShowForBooking(showId);
    if (!show) throw new NotFoundError("Show not found");
    const layout = await screenLookup.getSeatLayout(show.screenId);
    if (!layout) throw new NotFoundError("Screen not found");

    const seatTypeBySeatId = expandSeatLayout(layout);
    const priceBySeatType = new Map(
      show.pricing.map((p) => [p.seatType, p.price]),
    );

    const [bookedSeatIds, heldSeatIds] = await Promise.all([
      bookingRepo.findBookedSeatIds(showId),
      seatHold.listHeldSeatIds(showId),
    ]);
    const booked = new Set(bookedSeatIds);
    const held = new Set(heldSeatIds);

    return Array.from(seatTypeBySeatId.entries()).map(([seatId, seatType]) => ({
      seatId,
      seatType,
      price: priceBySeatType.get(seatType) ?? 0,
      status: booked.has(seatId)
        ? "booked"
        : held.has(seatId)
          ? "held"
          : "available",
    }));
  };
}

export function makeHoldSeats(
  seatHold: SeatHoldPort,
  showLookup: ShowLookupPort,
) {
  return async (showId: string, seatIds: string[]) => {
    const show = await showLookup.getShowForBooking(showId);
    if (!show) throw new NotFoundError("Show not found");

    const holdId = randomUUID();
    const result = await seatHold.holdSeats(
      showId,
      seatIds,
      holdId,
      HOLD_TTL_SECONDS,
    );
    return {
      holdId,
      unavailableSeatIds: result.unavailableSeatIds,
      expiresAt: result.expiresAt,
    };
  };
}

export function makeCreateBooking(
  bookingRepo: BookingRepository,
  showLookup: ShowLookupPort,
  screenLookup: ScreenLookupPort,
  seatHold: SeatHoldPort,
) {
  return async (
    userId: string,
    showId: string,
    holdId: string,
    seatIds: string[],
  ) => {
    const holdIsValid = await seatHold.verifyHold(showId, seatIds, holdId);
    if (!holdIsValid)
      throw new ConflictError(
        "Seat hold has expired or seats are no longer reserved",
      );

    const show = await showLookup.getShowForBooking(showId);
    if (!show) throw new NotFoundError("Show not found");
    const layout = await screenLookup.getSeatLayout(show.screenId);
    if (!layout) throw new NotFoundError("Screen not found");

    const seatTypeBySeatId = expandSeatLayout(layout);
    const priceBySeatType = new Map(
      show.pricing.map((p) => [p.seatType, p.price]),
    );
    const totalAmount = seatIds.reduce((sum, seatId) => {
      const seatType = seatTypeBySeatId.get(seatId);
      const price = seatType ? (priceBySeatType.get(seatType) ?? 0) : 0;
      return sum + price;
    }, 0);

    return bookingRepo.create({
      userId,
      showId,
      seatIds,
      status: "pending_payment",
      totalAmount,
      holdId,
    });
  };
}

export function makeGetBooking(bookingRepo: BookingRepository) {
  return async (id: string) => {
    const booking = await bookingRepo.findById(id);
    if (!booking) throw new NotFoundError("Booking not found");
    return booking;
  };
}

export function makeListMyBookings(bookingRepo: BookingRepository) {
  return (userId: string, params: { page: number; limit: number }) =>
    bookingRepo.findByUserId(userId, params);
}

export function makeListAllBookings(bookingRepo: BookingRepository) {
  return (params: { page: number; limit: number }) => bookingRepo.list(params);
}

/** Called by the payment module once Stripe confirms the charge. */
export function makeConfirmBooking(
  bookingRepo: BookingRepository,
  seatHold: SeatHoldPort,
) {
  return async (id: string) => {
    const booking = await bookingRepo.findById(id);
    if (!booking) throw new NotFoundError("Booking not found");
    const confirmed = await bookingRepo.updateStatus(id, "confirmed");
    await seatHold.releaseSeats(booking.showId, booking.seatIds);
    return confirmed;
  };
}

/** Called by the payment module on payment failure, or by a lazy staleness check. */
export function makeCancelBooking(
  bookingRepo: BookingRepository,
  seatHold: SeatHoldPort,
) {
  return async (id: string, status: "cancelled" | "expired" = "cancelled") => {
    const booking = await bookingRepo.findById(id);
    if (!booking) throw new NotFoundError("Booking not found");
    const updated = await bookingRepo.updateStatus(id, status);
    await seatHold.releaseSeats(booking.showId, booking.seatIds);
    return updated;
  };
}
