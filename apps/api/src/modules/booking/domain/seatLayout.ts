import type { SeatType } from "@ticketverse/schemas";

export interface SeatLayoutRow {
  row: string;
  seatCount: number;
  seatType: SeatType;
}

/** Expands a screen's compact row layout into individual seatId -> seatType entries. */
export function expandSeatLayout(
  layout: SeatLayoutRow[],
): Map<string, SeatType> {
  const seatTypeBySeatId = new Map<string, SeatType>();
  for (const row of layout) {
    for (let seatNumber = 1; seatNumber <= row.seatCount; seatNumber += 1) {
      seatTypeBySeatId.set(`${row.row}${seatNumber}`, row.seatType);
    }
  }
  return seatTypeBySeatId;
}
