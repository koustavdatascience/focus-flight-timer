import type { FocusTrip } from "@/lib/supabase";

export function getLatestCompletedTrip(trips: FocusTrip[]) {
  return trips
    .filter((trip) => trip.status === "completed")
    .sort((first, second) => new Date(second.completed_at ?? second.started_at).getTime() - new Date(first.completed_at ?? first.started_at).getTime())[0] ?? null;
}
