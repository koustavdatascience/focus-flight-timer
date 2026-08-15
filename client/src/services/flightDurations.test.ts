import { describe, expect, it } from "vitest";
import type { Destination } from "./airportSearch";
import { estimateFlightDuration, formatFlightClock, formatFlightDuration, getBootstrapFlightDuration, pickRandomDestinationForDuration } from "./flightDurations";

function airport(id: string, latitude: number, longitude: number, scheduledService = true): Destination {
  return {
    id,
    name: `${id} International`,
    city: id,
    country: "Test country",
    countryCode: "TS",
    iata: id,
    icao: `T${id}`,
    latitude,
    longitude,
    type: "large_airport",
    scheduledService,
    isMajor: true,
    priority: 10,
  };
}

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

  it("selects an eligible airport whose duration is closest to the requested focus time", () => {
    const origin = airport("ORG", 0, 0);
    const nearHour = airport("NEAR", 0, 3);
    const longHaul = airport("FAR", 0, 25);

    const recommendation = pickRandomDestinationForDuration(origin, 60 * 60, [origin, nearHour, longHaul], () => 0);

    expect(recommendation?.destination.id).toBe("NEAR");
    expect(recommendation?.duration.durationSeconds).toBeLessThan(75 * 60);
    expect(recommendation?.durationDifferenceSeconds).toBeLessThan(10 * 60);
  });

  it("never offers the origin or airports without scheduled service", () => {
    const origin = airport("ORG", 0, 0);
    const unavailable = airport("OFF", 0, 2, false);

    expect(pickRandomDestinationForDuration(origin, 60 * 60, [origin, unavailable])).toBeNull();
  });
});
