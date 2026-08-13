import { describe, expect, it } from "vitest";
import { calculateActiveStreakDays, getSoloProfileStats } from "./profileStats";

describe("solo profile statistics", () => {
  it("counts completed solo focus only and keeps distance separate", () => {
    const stats = getSoloProfileStats([
      { status: "completed", focus_duration_seconds: 3600, distance_km: 1200, completed_at: "2026-08-14T09:00:00.000Z" },
      { status: "in_progress", focus_duration_seconds: 1800, distance_km: 400, completed_at: null },
    ], new Date("2026-08-14T12:00:00.000Z"));
    expect(stats).toEqual({ completedFlights: 1, totalFocusSeconds: 3600, totalDistanceKm: 1200, activeStreakDays: 1 });
  });

  it("counts only consecutive completed flight days as an active streak", () => {
    expect(calculateActiveStreakDays([
      "2026-08-14T01:00:00.000Z",
      "2026-08-13T01:00:00.000Z",
      "2026-08-12T01:00:00.000Z",
      "2026-08-10T01:00:00.000Z",
    ], new Date("2026-08-14T12:00:00.000Z"))).toBe(3);
  });
});
