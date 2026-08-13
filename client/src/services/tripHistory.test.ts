import { describe, expect, it } from "vitest";
import type { FocusTrip } from "@/lib/supabase";
import { getLatestCompletedTrip } from "./tripHistory";

function makeTrip(overrides: Partial<FocusTrip>): FocusTrip {
  return {
    id: "trip-1",
    user_id: "user-1",
    origin_airport_id: "CCU",
    destination_airport_id: "DEL",
    distance_km: 1319,
    focus_duration_seconds: 9900,
    flight_duration_route_key: "CCU-DEL",
    duration_source: "verified_direct",
    duration_source_label: "Direct schedule duration · FlightsFrom",
    elapsed_seconds: 9900,
    is_paused: false,
    status: "completed",
    started_at: "2026-08-10T10:00:00.000Z",
    completed_at: "2026-08-10T12:45:00.000Z",
    created_at: "2026-08-10T10:00:00.000Z",
    updated_at: "2026-08-10T12:45:00.000Z",
    ...overrides,
  };
}

describe("latest completed flight", () => {
  it("uses the most recent completion instead of the latest started in-progress flight", () => {
    const earlierCompleted = makeTrip({ id: "earlier", destination_airport_id: "DEL", completed_at: "2026-08-10T12:45:00.000Z" });
    const latestCompleted = makeTrip({ id: "latest", destination_airport_id: "BLR", started_at: "2026-08-08T10:00:00.000Z", completed_at: "2026-08-12T08:00:00.000Z" });
    const inProgress = makeTrip({ id: "active", destination_airport_id: "JFK", status: "in_progress", started_at: "2026-08-13T10:00:00.000Z", completed_at: null });

    expect(getLatestCompletedTrip([inProgress, earlierCompleted, latestCompleted])?.destination_airport_id).toBe("BLR");
  });
});
