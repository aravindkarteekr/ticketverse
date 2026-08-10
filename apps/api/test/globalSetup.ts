import { writeFileSync, unlinkSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";

const URI_FILE = new URL("./.mongo-uri", import.meta.url);

// Runs once for the entire test run (not per test file) so we only ever boot a single in-memory
// MongoDB instance — starting one per file was flaky/slow (second instance timed out under load).
export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  writeFileSync(URI_FILE, mongod.getUri("ticketverse-test"), "utf-8");

  return async () => {
    await mongod.stop();
    try {
      unlinkSync(URI_FILE);
    } catch {
      // already removed
    }
  };
}
