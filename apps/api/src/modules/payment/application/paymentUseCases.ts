import type Stripe from "stripe";
import { env } from "../../../shared/config/env.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";
import type { PaymentRepository } from "../domain/ports/PaymentRepository.js";
import type { BookingConfirmationPort } from "../domain/ports/BookingConfirmationPort.js";

export function makeCreatePaymentIntent(
  paymentRepo: PaymentRepository,
  bookingConfirmation: BookingConfirmationPort,
  stripe: Stripe,
) {
  return async (userId: string, bookingId: string) => {
    const booking = await bookingConfirmation.getBookingForPayment(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");
    if (booking.userId !== userId) throw new NotFoundError("Booking not found");
    if (booking.status !== "pending_payment") {
      throw new ConflictError("Booking is not awaiting payment");
    }

    const currency = env.PAYMENT_CURRENCY;
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100),
      currency,
      metadata: { bookingId },
    });

    const payment = await paymentRepo.create({
      bookingId,
      stripePaymentIntentId: intent.id,
      amount: booking.totalAmount,
      currency,
      status: "pending",
    });

    return {
      clientSecret: intent.client_secret!,
      amount: payment.amount,
      currency: payment.currency,
    };
  };
}

export function makeHandleStripeWebhook(
  paymentRepo: PaymentRepository,
  bookingConfirmation: BookingConfirmationPort,
  stripe: Stripe,
) {
  return async (rawBody: Buffer, signature: string) => {
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new ValidationError("Invalid Stripe webhook signature");
    }

    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const payment = await paymentRepo.findByStripePaymentIntentId(intent.id);
      if (!payment) return;

      if (event.type === "payment_intent.succeeded") {
        await paymentRepo.updateStatus(payment.id, "succeeded");
        await bookingConfirmation.confirmBooking(payment.bookingId);
      } else {
        await paymentRepo.updateStatus(payment.id, "failed");
        await bookingConfirmation.cancelBooking(payment.bookingId);
      }
    }
  };
}
