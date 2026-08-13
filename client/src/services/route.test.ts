import { describe, expect, it } from "vitest";
import { getAirportByCode } from "@/services/airportSearch";
import { aircraftAtProgress, greatCircleRoute } from "./route";

function airportCoordinate(code: string) {
  const airport = getAirportByCode(code);
  if (!airport) throw new Error(`Missing airport fixture: ${code}`);
  return { latitude: airport.latitude, longitude: airport.longitude };
}

describe("great-circle flight routes", () => {
  const origin = airportCoordinate("CCU");
  const destinations = ["DEL", "BLR", "BOM", "DXB", "LHR", "JFK", "YYC", "ACA"];

  it.each(destinations)("creates a finite geographic route from CCU to %s", (destinationCode) => {
    const route = greatCircleRoute(origin, airportCoordinate(destinationCode));

    expect(route.animationCoordinates.length).toBeGreaterThan(2);
    expect(route.renderSegments.length).toBeGreaterThan(0);
    for (const segment of route.renderSegments) {
      for (let index = 1; index < segment.length; index += 1) {
        expect(Math.abs(segment[index].longitude - segment[index - 1].longitude)).toBeLessThanOrEqual(180);
      }
    }
  });

  it("keeps the aircraft at the end of the progressively revealed CCU → New York route", () => {
    const route = greatCircleRoute(origin, airportCoordinate("JFK"));
    const aircraft = aircraftAtProgress(route, 0.5);
    const renderedEnd = aircraft.visibleSegments.flat().at(-1);

    expect(renderedEnd?.latitude).toBeCloseTo(aircraft.coordinate.latitude, 8);
    expect(renderedEnd?.longitude).toBeCloseTo(aircraft.coordinate.longitude, 8);
    expect(aircraft.bearing).toBeGreaterThanOrEqual(0);
    expect(aircraft.bearing).toBeLessThan(360);
  });

  it("splits a dateline-crossing route instead of joining map edges with a world-spanning segment", () => {
    const route = greatCircleRoute(
      { latitude: 35.5494, longitude: 139.7798 },
      { latitude: 37.6213, longitude: -122.379 },
    );

    expect(route.crossesAntimeridian).toBe(true);
    expect(route.renderSegments.length).toBeGreaterThan(1);
    for (const segment of route.renderSegments) {
      for (let index = 1; index < segment.length; index += 1) {
        expect(Math.abs(segment[index].longitude - segment[index - 1].longitude)).toBeLessThanOrEqual(180);
      }
    }
  });
});
