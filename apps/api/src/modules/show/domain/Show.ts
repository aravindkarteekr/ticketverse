import type { SeatType } from "@ticketverse/schemas";

export interface SeatPricing {
  seatType: SeatType;
  price: number;
}

export interface ShowEntity {
  id: string;
  movieId: string;
  screenId: string;
  theatreId: string;
  startTime: Date;
  pricing: SeatPricing[];
  createdAt: Date;
}

export type NewShow = Omit<ShowEntity, "id" | "createdAt">;
export type ShowUpdate = Partial<Pick<ShowEntity, "startTime" | "pricing">>;
