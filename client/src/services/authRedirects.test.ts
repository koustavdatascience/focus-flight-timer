import { describe, expect, it } from "vitest";
import { getAuthRedirectUrl } from "./authRedirects";

describe("Waypoint authentication redirects", () => {
  it("returns a same-origin password-recovery route that opens the new-password flow", () => {
    expect(getAuthRedirectUrl("https://project-waypoint-app.vercel.app", "password-recovery"))
      .toBe("https://project-waypoint-app.vercel.app/?auth=reset");
  });

  it("keeps OAuth returns on the application root without a recovery-only state", () => {
    expect(getAuthRedirectUrl("https://project-waypoint-app.vercel.app", "oauth"))
      .toBe("https://project-waypoint-app.vercel.app/");
  });
});
