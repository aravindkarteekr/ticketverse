import type { SeatType } from "@ticketverse/schemas";
import type { ShowLookupPort } from "../../booking/domain/ports/ShowLookupPort.js";
import { ShowModel } from "./ShowModel.js";

/** Real implementation of booking's show-lookup port, backed by this module's Mongoose model. */
export class ShowLookupAdapter implements ShowLookupPort {
  async getShowForBooking(showId: string) {
    const show = await ShowModel.findById(showId);
    if (!show) return null;
    return {
      screenId: show.screenId.toString(),
      pricing: show.pricing.map((p) => ({
        seatType: p.seatType as SeatType,
        price: p.price,
      })),
      startTime: show.startTime,
    };
  }
}
