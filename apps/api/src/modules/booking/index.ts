import type { Router } from "express";
import type { ShowLookupPort } from "./domain/ports/ShowLookupPort.js";
import type { ScreenLookupPort } from "./domain/ports/ScreenLookupPort.js";
import type { BookingConfirmationPort } from "../payment/domain/ports/BookingConfirmationPort.js";
import { createBookingRouter } from "./interface/http/bookingRoutes.js";
import { BookingConfirmationAdapter } from "./infrastructure/BookingConfirmationAdapter.js";

export function createBookingModuleRouter(
  showLookup: ShowLookupPort,
  screenLookup: ScreenLookupPort,
): Router {
  return createBookingRouter(showLookup, screenLookup);
}

/** Real booking-confirmation implementation, wired into the payment module at composition root. */
export function createBookingConfirmationPort(): BookingConfirmationPort {
  return new BookingConfirmationAdapter();
}

export type { ShowLookupPort, ScreenLookupPort };
