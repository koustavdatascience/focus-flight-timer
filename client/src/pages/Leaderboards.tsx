import { ArrowLeft, Plane, Trophy, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getFocusLeaderboard, type PublicLeaderboardRow } from "@/lib/supabase";
import { formatFocusTime, rankLeaderboardEntries, type LeaderboardCategory, type LeaderboardPeriod } from "@/services/leaderboardState";
import "../journey.css";

const categoryCopy: Record<LeaderboardCategory, { label: string; detail: string; icon: typeof Plane }> = {
  solo: { label: "Solo Focus", detail: "Completed personal focus flights", icon: Plane },
  cofocus: { label: "Co-Focus", detail: "Completed shared-room focus flights", icon: UsersRound },
};

export default function Leaderboards() {
  const [, navigate] = useLocation();
  const [category, setCategory] = useState<LeaderboardCategory>("solo");
  const [period, setPeriod] = useState<LeaderboardPeriod>("monthly");
  const [rows, setRows] = useState<PublicLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void getFocusLeaderboard(category, period)
      .then((nextRows) => {
        if (active) setRows(nextRows);
      })
      .catch(() => {
        if (active) setError("The leaderboard is temporarily unavailable. Please try again shortly.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [category, period]);

  const rankedRows = rankLeaderboardEntries(rows);
  const CategoryIcon = categoryCopy[category].icon;

  return (
    <main className="journey-page leaderboard-page">
      <header className="journey-header leaderboard-header">
        <button className="journey-wordmark" onClick={() => navigate("/")}>Waypoint</button>
        <div className="leaderboard-header-actions">
          <button className="journey-back-button" onClick={() => navigate("/")}><ArrowLeft size={14} /> Back to timer</button>
        </div>
      </header>

      <section className="leaderboard-hero" aria-labelledby="leaderboard-title">
        <span className="journey-eyebrow"><Trophy size={14} /> Flight log rankings</span>
        <h1 id="leaderboard-title">Focus, <em>logged together.</em></h1>
        <p>Rankings reflect completed focus time only. Solo and Co-Focus journeys are intentionally kept separate.</p>
      </section>

      <section className="leaderboard-shell" aria-label="Waypoint leaderboards">
        <div className="leaderboard-controls">
          <div className="leaderboard-tabs" role="tablist" aria-label="Leaderboard category">
            {(Object.keys(categoryCopy) as LeaderboardCategory[]).map((value) => {
              const Icon = categoryCopy[value].icon;
              return <button key={value} role="tab" aria-selected={category === value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}><Icon size={14} /> {categoryCopy[value].label}</button>;
            })}
          </div>
          <div className="leaderboard-tabs leaderboard-period-tabs" role="tablist" aria-label="Leaderboard period">
            <button role="tab" aria-selected={period === "monthly"} className={period === "monthly" ? "active" : ""} onClick={() => setPeriod("monthly")}>This month</button>
            <button role="tab" aria-selected={period === "all_time"} className={period === "all_time" ? "active" : ""} onClick={() => setPeriod("all_time")}>All time</button>
          </div>
        </div>

        <div className="leaderboard-summary"><CategoryIcon size={15} /><span>{categoryCopy[category].detail}</span><small>{period === "monthly" ? "UTC calendar month" : "Career total"}</small></div>

        {loading ? <div className="leaderboard-state">Loading the flight log…</div> : error ? <div className="leaderboard-state leaderboard-error">{error}</div> : rankedRows.length === 0 ? <div className="leaderboard-state"><Trophy size={21} /><strong>No completed flights yet.</strong><span>The first completed {category === "solo" ? "solo" : "Co-Focus"} flight will appear here for pilots who opt in to rankings.</span></div> : (
          <ol className="leaderboard-list">
            {rankedRows.map((entry) => (
              <li key={entry.user_id} className={entry.sharedRank <= 3 ? "leaderboard-row leaderboard-row-leading" : "leaderboard-row"}>
                <span className="leaderboard-rank" aria-label={`Rank ${entry.sharedRank}`}>{entry.sharedRank}</span>
                <button className="leaderboard-pilot" onClick={() => navigate(`/u/${entry.handle}`)} aria-label={`View ${entry.display_name || entry.handle}'s profile`}>
                  <span className="leaderboard-avatar" aria-hidden="true">{(entry.display_name || entry.handle).slice(0, 1).toUpperCase()}</span>
                  <span><strong>{entry.display_name || entry.handle}</strong><small>@{entry.handle}</small></span>
                </button>
                <span className="leaderboard-score"><strong>{formatFocusTime(entry.completed_focus_seconds)}</strong><small>{entry.completed_flights} completed {entry.completed_flights === 1 ? "flight" : "flights"}</small></span>
              </li>
            ))}
          </ol>
        )}
        <p className="leaderboard-note">Pilots can opt out in their private Pilot Log at any time. Distance is a personal Explorer statistic, never a ranking metric.</p>
      </section>
    </main>
  );
}
