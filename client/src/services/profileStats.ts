export type CompletedSoloTrip = {
  status: "in_progress" | "completed";
  focus_duration_seconds: number;
  distance_km: number;
  completed_at: string | null;
};

export type SoloProfileStats = {
  completedFlights: number;
  totalFocusSeconds: number;
  totalDistanceKm: number;
  activeStreakDays: number;
};

function utcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calculateActiveStreakDays(completedAt: Array<string | null>, now = new Date()) {
  const dayMs = 86_400_000;
  const completedDays = new Set(
    completedAt
      .filter((value): value is string => Boolean(value))
      .map((value) => utcDay(new Date(value)))
  );

  const today = utcDay(now);
  let cursor = today;
  if (!completedDays.has(cursor)) cursor -= dayMs;
  if (!completedDays.has(cursor)) return 0;

  let streak = 0;
  while (completedDays.has(cursor)) {
    streak += 1;
    cursor -= dayMs;
  }
  return streak;
}

export function getSoloProfileStats(trips: CompletedSoloTrip[], now = new Date()): SoloProfileStats {
  const completed = trips.filter((trip) => trip.status === "completed");
  return {
    completedFlights: completed.length,
    totalFocusSeconds: completed.reduce((total, trip) => total + trip.focus_duration_seconds, 0),
    totalDistanceKm: completed.reduce((total, trip) => total + trip.distance_km, 0),
    activeStreakDays: calculateActiveStreakDays(completed.map((trip) => trip.completed_at), now),
  };
}
