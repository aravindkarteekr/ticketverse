import { Router } from "express";
import { createPaymentIntentSchema } from "@ticketverse/schemas";
import { validate } from "../../../../shared/middleware/validate.js";
import { authenticate } from "../../../../shared/middleware/authenticate.js";
import { asyncHandler } from "../../../../shared/middleware/asyncHandler.js";
import { stripe } from "../../../../shared/lib/stripe.js";
import { MongoPaymentRepository } from "../../infrastructure/MongoPaymentRepository.js";
import type { BookingConfirmationPort } from "../../domain/ports/BookingConfirmationPort.js";
import { makeCreatePaymentIntent } from "../../application/paymentUseCases.js";

export function createPaymentRouter(
  bookingConfirmation: BookingConfirmationPort,
): Router {
  const paymentRepo = new MongoPaymentRepository();
  const createPaymentIntent = makeCreatePaymentIntent(
    paymentRepo,
    bookingConfirmation,
    stripe,
  );

  const router = Router();

  router.post(
    "/payments/intent",
    authenticate,
    validate(createPaymentIntentSchema),
    asyncHandler(async (req, res) => {
      const { bookingId } = req.body as { bookingId: string };
      const result = await createPaymentIntent(req.user!.id, bookingId);
      res.status(201).json(result);
    }),
  );

  return router;
}
