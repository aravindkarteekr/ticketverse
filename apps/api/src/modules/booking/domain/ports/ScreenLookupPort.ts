import type { SeatLayoutRow } from "../seatLayout.js";

/** Anti-corruption port so `booking` can read a screen's seat layout without depending on `theatre` internals. */
export interface ScreenLookupPort {
  getSeatLayout(screenId: string): Promise<SeatLayoutRow[] | null>;
}
