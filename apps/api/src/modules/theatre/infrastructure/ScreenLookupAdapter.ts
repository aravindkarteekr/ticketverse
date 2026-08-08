import type { SeatType } from "@ticketverse/schemas";
import type { ScreenLookupPort } from "../../booking/domain/ports/ScreenLookupPort.js";
import { ScreenModel } from "./ScreenModel.js";

/** Real implementation of booking's screen-lookup port, backed by this module's Mongoose model. */
export class ScreenLookupAdapter implements ScreenLookupPort {
  async getSeatLayout(screenId: string) {
    const screen = await ScreenModel.findById(screenId);
    if (!screen) return null;
    return screen.layout.map((row) => ({
      row: row.row,
      seatCount: row.seatCount,
      seatType: row.seatType as SeatType,
    }));
  }
}
