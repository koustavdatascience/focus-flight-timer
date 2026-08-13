import type { Destination } from "@/services/airportSearch";
import type { FlightDuration } from "@/services/flightDurations";
import type { FocusTrip } from "@/lib/supabase";

type StartTripInput = Pick<FocusTrip, "user_id" | "origin_airport_id" | "destination_airport_id" | "distance_km" | "focus_duration_seconds" | "flight_duration_route_key" | "duration_source" | "duration_source_label">;

export function createFocusTripInput(input: {
  userId: string;
  origin: Destination;
  destination: Destination;
  distanceKm: number;
  duration: FlightDuration;
}): StartTripInput {
  return {
    user_id: input.userId,
    origin_airport_id: String(input.origin.id),
    destination_airport_id: String(input.destination.id),
    distance_km: Math.round(input.distanceKm),
    focus_duration_seconds: input.duration.durationSeconds,
    flight_duration_route_key: input.duration.routeKey,
    duration_source: input.duration.source,
    duration_source_label: input.duration.sourceLabel,
  };
}
