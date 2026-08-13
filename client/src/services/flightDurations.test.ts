import { describe, expect, it } from "vitest";
import { estimateFlightDuration, formatFlightClock, formatFlightDuration, getBootstrapFlightDuration } from "./flightDurations";

describe("flight duration formatting and estimation", () => {
  it("formats a realistic route duration for cards and the timer", () => {
    expect(formatFlightDuration(2 * 60 * 60 + 45 * 60)).toBe("2h 45m");
    expect(formatFlightClock(2 * 60 * 60 + 45 * 60)).toBe("02:45:00");
  });

  it("keeps a sourced direct route separate from the estimation fallback", () => {
    const sourced = getBootstrapFlightDuration("CCU-DEL");
    expect(sourced).toMatchObject({
      durationSeconds: 2 * 60 * 60 + 45 * 60,
      source: "verified_direct",
      isDirect: true,
      sourceUrl: "https://www.flightsfrom.com/CCU-DEL",
    });
  });

  it("labels a commercial-speed fallback as an estimate instead of a direct flight", () => {
    const estimate = estimateFlightDuration(1319, "CCU-XYZ");
    expect(estimate.source).toBe("estimated");
    expect(estimate.isDirect).toBe(false);
    expect(estimate.durationSeconds).toBeGreaterThan(0);
    expect(estimate.sourceLabel).toContain("Estimated");
  });
});
