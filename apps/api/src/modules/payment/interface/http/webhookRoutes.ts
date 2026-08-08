import { Router, raw } from "express";
import { stripe } from "../../../../shared/lib/stripe.js";
import { asyncHandler } from "../../../../shared/middleware/asyncHandler.js";
import { ValidationError } from "../../../../shared/errors/AppError.js";
import { MongoPaymentRepository } from "../../infrastructure/MongoPaymentRepository.js";
import type { BookingConfirmationPort } from "../../domain/ports/BookingConfirmationPort.js";
import { makeHandleStripeWebhook } from "../../application/paymentUseCases.js";

/**
 * Mounted directly in `app.ts` BEFORE the global `express.json()` parser — Stripe signature
 * verification requires the exact raw request body bytes.
 */
export function createPaymentWebhookRouter(bookingConfirmation: BookingConfirmationPort): Router {
  const paymentRepo = new MongoPaymentRepository();
  const handleWebhook = makeHandleStripeWebhook(paymentRepo, bookingConfirmation, stripe);

  const router = Router();

  router.post(
    "/payments/webhook",
    raw({ type: "application/json" }),
    asyncHandler(async (req, res) => {
      const signature = req.headers["stripe-signature"];
      if (typeof signature !== "string") throw new ValidationError("Missing Stripe signature header");
      await handleWebhook(req.body as Buffer, signature);
      res.json({ received: true });
    }),
  );

  return router;
}
