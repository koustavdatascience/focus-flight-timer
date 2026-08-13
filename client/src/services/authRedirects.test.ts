import { describe, expect, it } from "vitest";
import { getAuthRedirectUrl } from "./authRedirects";

describe("FocusFlight authentication redirects", () => {
  it("returns a same-origin password-recovery route that opens the new-password flow", () => {
    expect(getAuthRedirectUrl("https://focus-flight-timer.vercel.app", "password-recovery"))
      .toBe("https://focus-flight-timer.vercel.app/?auth=reset");
  });

  it("keeps OAuth returns on the application root without a recovery-only state", () => {
    expect(getAuthRedirectUrl("https://focus-flight-timer.vercel.app", "oauth"))
      .toBe("https://focus-flight-timer.vercel.app/");
  });
});
