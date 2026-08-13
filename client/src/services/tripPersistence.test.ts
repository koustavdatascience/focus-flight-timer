import { describe, expect, it } from "vitest";
import type { Destination } from "@/services/airportSearch";
import { createFocusTripInput } from "./tripPersistence";

const origin = { id: "CCU", iata: "CCU", icao: "VECC", city: "Kolkata", country: "India", name: "Netaji Subhas Chandra Bose International Airport", latitude: 22.6547, longitude: 88.4467 } as Destination;
const destination = { id: "DEL", iata: "DEL", icao: "VIDP", city: "New Delhi", country: "India", name: "Indira Gandhi International Airport", latitude: 28.5562, longitude: 77.1 } as Destination;

describe("focus-trip duration persistence", () => {
  it("keeps sourced duration seconds and provenance on the authenticated trip payload", () => {
    expect(createFocusTripInput({
      userId: "user-1",
      origin,
      destination,
      distanceKm: 1319.4,
      duration: {
        routeKey: "CCU-DEL",
        durationSeconds: 9900,
        source: "verified_direct",
        sourceLabel: "Direct schedule duration · FlightsFrom",
        sourceUrl: "https://www.flightsfrom.com/CCU-DEL",
        isDirect: true,
      },
    })).toMatchObject({
      origin_airport_id: "CCU",
      destination_airport_id: "DEL",
      distance_km: 1319,
      focus_duration_seconds: 9900,
      flight_duration_route_key: "CCU-DEL",
      duration_source: "verified_direct",
      duration_source_label: "Direct schedule duration · FlightsFrom",
    });
  });
});
