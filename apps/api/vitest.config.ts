import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    globalSetup: ["./test/globalSetup.ts"],
    setupFiles: ["./test/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Run test files sequentially: they share one MongoMemoryServer instance (started once in
    // globalSetup) and each file's afterEach wipes all collections, so concurrent files would race.
    fileParallelism: false,
  },
});
