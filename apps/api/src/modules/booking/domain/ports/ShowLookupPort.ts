import type { SeatPricing } from "@ticketverse/schemas";

/** Anti-corruption port so `booking` can read show pricing without depending on `show` internals. */
export interface ShowLookupPort {
  getShowForBooking(
    showId: string,
  ): Promise<{ screenId: string; pricing: SeatPricing[]; startTime: Date } | null>;
}
