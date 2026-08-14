export type LeaderboardCategory = "solo" | "cofocus";
export type LeaderboardPeriod = "monthly" | "all_time";

export type LeaderboardScore = {
  completed_focus_seconds: number;
  completed_flights: number;
  last_score_at: string | null;
};

export type RankedLeaderboardEntry<T extends LeaderboardScore> = T & {
  sharedRank: number;
};

export function leaderboardPeriodStart(period: LeaderboardPeriod, date = new Date()) {
  if (period === "all_time") return "1970-01-01";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function rankLeaderboardEntries<T extends LeaderboardScore>(entries: T[]): RankedLeaderboardEntry<T>[] {
  let priorScore: number | null = null;
  let sharedRank = 0;

  return entries.map((entry, index) => {
    if (priorScore !== entry.completed_focus_seconds) {
      sharedRank = index + 1;
      priorScore = entry.completed_focus_seconds;
    }
    return { ...entry, sharedRank };
  });
}

export function formatFocusTime(totalSeconds: number) {
  const totalMinutes = Math.max(0, Math.round(totalSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
