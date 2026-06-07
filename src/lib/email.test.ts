import { describe, it, expect, vi } from "vitest";

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn() },
  })),
}));

describe("email", () => {
  it("email functions exist and are callable", async () => {
    const email = await import("./email");
    expect(typeof email.sendPasswordResetEmail).toBe("function");
    expect(typeof email.sendVerificationEmail).toBe("function");
    expect(typeof email.sendContactEmail).toBe("function");
  });

  it("sendPasswordResetEmail returns false without API key", async () => {
    const { sendPasswordResetEmail } = await import("./email");
    const result = await sendPasswordResetEmail("test@test.com", "http://localhost/reset");
    expect(result).toBe(false);
  });

  it("sendVerificationEmail returns false without API key", async () => {
    const { sendVerificationEmail } = await import("./email");
    const result = await sendVerificationEmail("test@test.com", "http://localhost/verify");
    expect(result).toBe(false);
  });

  it("sendContactEmail returns false without API key", async () => {
    const { sendContactEmail } = await import("./email");
    const result = await sendContactEmail(
      "owner@test.com",
      "Owner",
      "Test Property",
      "Tenant",
      "tenant@test.com",
      "Hola, me interesa la propiedad"
    );
    expect(result).toBe(false);
  });
});
