import type { Router } from "express";
import type { BookingConfirmationPort } from "./domain/ports/BookingConfirmationPort.js";
import { createPaymentRouter } from "./interface/http/paymentRoutes.js";
import { createPaymentWebhookRouter } from "./interface/http/webhookRoutes.js";

export function createPaymentModuleRouter(bookingConfirmation: BookingConfirmationPort): Router {
  return createPaymentRouter(bookingConfirmation);
}

/** Mounted separately (and earlier) in `app.ts` — see `webhookRoutes.ts` for why. */
export function createPaymentWebhookModuleRouter(bookingConfirmation: BookingConfirmationPort): Router {
  return createPaymentWebhookRouter(bookingConfirmation);
}

export type { BookingConfirmationPort };
