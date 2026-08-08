import type { Redis } from "ioredis";
import type { SeatHoldPort, SeatHoldResult } from "../domain/ports/SeatHoldPort.js";

function seatKey(showId: string, seatId: string): string {
  return `hold:show:${showId}:seat:${seatId}`;
}

/** Redis SETNX + TTL backed seat lock — the concurrency guard for the booking flow. */
export class RedisSeatHoldAdapter implements SeatHoldPort {
  constructor(private readonly redis: Redis) {}

  async holdSeats(
    showId: string,
    seatIds: string[],
    holdId: string,
    ttlSeconds: number,
  ): Promise<SeatHoldResult> {
    const acquired: string[] = [];
    const unavailableSeatIds: string[] = [];

    for (const seatId of seatIds) {
      // `NX` — only set if not already held/booked; `EX` — auto-expire abandoned holds.
      const result = await this.redis.set(seatKey(showId, seatId), holdId, "EX", ttlSeconds, "NX");
      if (result === "OK") {
        acquired.push(seatId);
      } else {
        unavailableSeatIds.push(seatId);
      }
    }

    if (unavailableSeatIds.length > 0) {
      // Roll back whatever we did manage to acquire so a partial conflict doesn't leak a stuck hold.
      if (acquired.length > 0) await this.releaseSeats(showId, acquired);
      return { unavailableSeatIds, expiresAt: new Date() };
    }

    return { unavailableSeatIds: [], expiresAt: new Date(Date.now() + ttlSeconds * 1000) };
  }

  async verifyHold(showId: string, seatIds: string[], holdId: string): Promise<boolean> {
    const values = await Promise.all(seatIds.map((seatId) => this.redis.get(seatKey(showId, seatId))));
    return values.every((value) => value === holdId);
  }

  async releaseSeats(showId: string, seatIds: string[]): Promise<void> {
    if (seatIds.length === 0) return;
    await this.redis.del(...seatIds.map((seatId) => seatKey(showId, seatId)));
  }

  async listHeldSeatIds(showId: string): Promise<string[]> {
    const keys = await this.redis.keys(seatKey(showId, "*"));
    return keys.map((key) => key.slice(seatKey(showId, "").length));
  }
}
