import { describe, expect, it } from "vitest";
import { formatFocusTime, leaderboardPeriodStart, rankLeaderboardEntries } from "./leaderboardState";

describe("FocusFlight leaderboard state", () => {
  it("uses UTC calendar-month boundaries without a destructive reset", () => {
    expect(leaderboardPeriodStart("monthly", new Date("2026-08-01T00:15:00+05:30"))).toBe("2026-07-01");
    expect(leaderboardPeriodStart("all_time", new Date("2026-08-01T00:15:00+05:30"))).toBe("1970-01-01");
  });

  it("assigns shared ranks from completed focus time while preserving ordering", () => {
    const ranked = rankLeaderboardEntries([
      { completed_focus_seconds: 7200, completed_flights: 1, last_score_at: "2026-08-03T00:00:00Z", label: "A" },
      { completed_focus_seconds: 7200, completed_flights: 2, last_score_at: "2026-08-04T00:00:00Z", label: "B" },
      { completed_focus_seconds: 3600, completed_flights: 1, last_score_at: "2026-08-05T00:00:00Z", label: "C" },
    ]);

    expect(ranked.map((entry) => [entry.label, entry.sharedRank])).toEqual([["A", 1], ["B", 1], ["C", 3]]);
  });

  it("formats focus time without using distance as a ranking surrogate", () => {
    expect(formatFocusTime(5_400)).toBe("1h 30m");
  });
});
