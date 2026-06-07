import { describe, it, expect, vi } from "vitest";

vi.mock("./db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), delete: vi.fn() },
}));

import { hashPassword, verifyPassword } from "./auth";

describe("auth", () => {
  it("hashPassword returns salt:hash format", () => {
    const hash = hashPassword("test123");
    expect(hash).toContain(":");
    const [salt, hashPart] = hash.split(":");
    expect(salt.length).toBe(32);
    expect(hashPart.length).toBe(64);
  });

  it("verifyPassword returns true for correct password", () => {
    const hash = hashPassword("mypassword");
    expect(verifyPassword("mypassword", hash)).toBe(true);
  });

  it("verifyPassword returns false for wrong password", () => {
    const hash = hashPassword("mypassword");
    expect(verifyPassword("wrongpassword", hash)).toBe(false);
  });

  it("different calls produce different hashes", () => {
    const hash1 = hashPassword("samepassword");
    const hash2 = hashPassword("samepassword");
    expect(hash1).not.toBe(hash2);
  });
});
