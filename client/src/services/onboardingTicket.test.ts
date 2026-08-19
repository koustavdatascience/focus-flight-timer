import { describe, expect, it } from "vitest";
import { createWaypointTicket } from "./onboardingTicket";
import type { Destination } from "./airportSearch";

const airport = (overrides: Partial<Destination> = {}): Destination => ({
  id: 1,
  name: "Kempegowda International Airport",
  city: "Bengaluru",
  country: "India",
  countryCode: "IN",
  iata: "BLR",
  icao: "VOBL",
  latitude: 13.1986,
  longitude: 77.7066,
  type: "large_airport",
  scheduledService: true,
  isMajor: true,
  priority: 10,
  ...overrides,
});

describe("Waypoint onboarding tickets", () => {
  it("issues unique trip codes for separate ticket creations", () => {
    const now = new Date("2026-08-20T10:00:00.000Z");
    const first = createWaypointTicket(airport(), airport({ id: 2, name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", countryCode: "AU", iata: "SYD", icao: "YSSY", latitude: -33.9461, longitude: 151.1772 }), 7200, now);
    const second = createWaypointTicket(airport(), airport({ id: 2, name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", countryCode: "AU", iata: "SYD", icao: "YSSY", latitude: -33.9461, longitude: 151.1772 }), 7200, now);

    expect(first.tripCode).not.toBe(second.tripCode);
    expect(first.flightNumber).toMatch(/^WY /);
    expect(first.originTimezone).toBe("Asia/Kolkata");
    expect(first.destinationTimezone).toBe("Australia/Sydney");
  });

  it("shows local departure and arrival labels with timezone names", () => {
    const ticket = createWaypointTicket(
      airport(),
      airport({ id: 2, name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", iata: "DXB", icao: "OMDB", latitude: 25.2532, longitude: 55.3657 }),
      14400,
      new Date("2026-08-20T10:00:00.000Z"),
    );

    expect(ticket.departureAt).toContain("IST");
    expect(ticket.arrivalAt).toContain("GST");
    expect(ticket.boardingAt).toContain("IST");
  });
});
