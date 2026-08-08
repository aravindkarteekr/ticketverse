import type { SeatType } from "@ticketverse/schemas";

export interface SeatLayoutRow {
  row: string;
  seatCount: number;
  seatType: SeatType;
}

export interface ScreenEntity {
  id: string;
  theatreId: string;
  name: string;
  layout: SeatLayoutRow[];
}

export type NewScreen = Omit<ScreenEntity, "id">;
