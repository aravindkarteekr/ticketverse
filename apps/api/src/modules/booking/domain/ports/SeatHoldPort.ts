export interface SeatHoldResult {
  /** Seat ids that are already taken by someone else (held or booked) — the hold was rolled back for these. */
  unavailableSeatIds: string[];
  expiresAt: Date;
}

/** Redis-backed (or equivalent) temporary seat lock, independent of the permanent Mongo booking record. */
export interface SeatHoldPort {
  /** Attempts to atomically hold every seat under one holdId; rolls back on partial conflict. */
  holdSeats(showId: string, seatIds: string[], holdId: string, ttlSeconds: number): Promise<SeatHoldResult>;
  /** True only if every seatId is currently held under exactly this holdId. */
  verifyHold(showId: string, seatIds: string[], holdId: string): Promise<boolean>;
  releaseSeats(showId: string, seatIds: string[]): Promise<void>;
  listHeldSeatIds(showId: string): Promise<string[]>;
}
