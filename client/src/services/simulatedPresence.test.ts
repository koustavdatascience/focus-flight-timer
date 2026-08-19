import { describe, expect, it } from "vitest";
import { getLocalHourKey, getSimulatedTravelerCount } from "./simulatedPresence";

describe("simulated traveler activity", () => {
  it("keeps the same estimate within the same local hour", () => {
    const first = new Date(2026, 7, 20, 14, 2, 0);
    const later = new Date(2026, 7, 20, 14, 58, 0);
    expect(getLocalHourKey(first)).toBe(getLocalHourKey(later));
    expect(getSimulatedTravelerCount(first)).toBe(getSimulatedTravelerCount(later));
  });

  it("changes predictably between hours and stays within the requested range", () => {
    const values = Array.from({ length: 24 }, (_, hour) => getSimulatedTravelerCount(new Date(2026, 7, 20, hour, 0, 0)));
    expect(values.every((value) => value >= 30 && value <= 70)).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(1);
  });
});
