/** Anti-corruption port so `payment` can read/confirm bookings without depending on `booking` internals. */
export interface BookingConfirmationPort {
  getBookingForPayment(
    bookingId: string,
  ): Promise<{ totalAmount: number; status: string; userId: string } | null>;
  confirmBooking(bookingId: string): Promise<void>;
  cancelBooking(bookingId: string): Promise<void>;
}
