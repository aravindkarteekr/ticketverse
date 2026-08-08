import type { BookingConfirmationPort } from "../../payment/domain/ports/BookingConfirmationPort.js";
import { MongoBookingRepository } from "./MongoBookingRepository.js";
import { RedisSeatHoldAdapter } from "./RedisSeatHoldAdapter.js";
import { redis } from "../../../shared/lib/redis.js";
import { makeCancelBooking, makeConfirmBooking } from "../application/bookingUseCases.js";

/** Real implementation of payment's booking-confirmation port, backed by this module's use-cases. */
export class BookingConfirmationAdapter implements BookingConfirmationPort {
  private readonly bookingRepo = new MongoBookingRepository();
  private readonly seatHold = new RedisSeatHoldAdapter(redis);
  private readonly confirmBookingUseCase = makeConfirmBooking(this.bookingRepo, this.seatHold);
  private readonly cancelBookingUseCase = makeCancelBooking(this.bookingRepo, this.seatHold);

  async getBookingForPayment(bookingId: string) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) return null;
    return { totalAmount: booking.totalAmount, status: booking.status, userId: booking.userId };
  }

  async confirmBooking(bookingId: string): Promise<void> {
    await this.confirmBookingUseCase(bookingId);
  }

  async cancelBooking(bookingId: string): Promise<void> {
    await this.cancelBookingUseCase(bookingId, "cancelled");
  }
}
