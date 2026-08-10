import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "../src/shared/lib/password.js";

describe("password hashing", () => {
  it("hashes a password with bcrypt so the hash never contains the plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    expect(hash).toMatch(/^\$2[aby]\$12\$/); // bcrypt with 12 salt rounds
  });

  it("produces a different hash each time (unique salt per call)", async () => {
    const [hashA, hashB] = await Promise.all([
      hashPassword("same-password"),
      hashPassword("same-password"),
    ]);

    expect(hashA).not.toBe(hashB);
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("s3cret!");

    await expect(comparePassword("s3cret!", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cret!");

    await expect(comparePassword("wrong-password", hash)).resolves.toBe(false);
  });
});
