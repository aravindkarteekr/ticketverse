import { readFileSync } from "node:fs";
import { afterAll, afterEach, vi } from "vitest";

// Deterministic, non-secret test values — set BEFORE any app module (which reads process.env at
// import time via shared/config/env.ts) is imported, either here or by a test file.
process.env.NODE_ENV = "test";
process.env.CLIENT_ORIGIN ??= "http://localhost:5173";
process.env.JWT_ACCESS_SECRET ??= "test-only-access-secret-0123456789-abcdef";
process.env.JWT_REFRESH_SECRET ??= "test-only-refresh-secret-0123456789-abcdef";
process.env.JWT_ACCESS_TTL ??= "15m";
process.env.JWT_REFRESH_TTL ??= "7d";
process.env.COOKIE_SECURE ??= "false";
process.env.STRIPE_SECRET_KEY ??= "sk_test_placeholder";
process.env.STRIPE_WEBHOOK_SECRET ??= "whsec_placeholder";
process.env.PAYMENT_CURRENCY ??= "usd";
process.env.REDIS_URL ??= "redis://127.0.0.1:6379/15";

// Swap the real ioredis client for an in-memory mock so seat-hold tests don't need a live Redis server.
vi.mock("ioredis", async () => {
  const { default: RedisMock } = await import("ioredis-mock");
  return { Redis: RedisMock, default: RedisMock };
});

const mongoUriFile = new URL("./.mongo-uri", import.meta.url);
process.env.MONGODB_URI = readFileSync(mongoUriFile, "utf-8").trim();

// Dynamic imports: everything below transitively imports shared/config/env.ts, which parses
// process.env at import time, so it must only be imported after the values above are set.
const { default: mongoose } = await import("mongoose");
const { connectMongo } = await import("../src/shared/lib/mongoose.js");

await connectMongo();

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await mongoose.disconnect();
});
