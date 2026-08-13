import { ArrowLeft, MapPin, Plane } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { getPublicProfileCard, type PublicProfileCard } from "@/lib/supabase";
import { getAirportById } from "@/services/airportSearch";

function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

export default function PublicProfile() {
  const [, params] = useRoute("/u/:handle");
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<PublicProfileCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handle = params?.handle || "";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void getPublicProfileCard(handle)
      .then((result) => { if (active) setProfile(result); })
      .catch(() => { if (active) setError("This profile could not be opened right now."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [handle]);

  const airport = profile?.current_airport_id ? getAirportById(profile.current_airport_id) : null;
  const visibleLocation = airport ? `${airport.city} · ${airport.iata || airport.icao}` : null;

  return <main className="public-profile-page">
    <header className="journey-header public-profile-header"><button className="journey-back-button" onClick={() => navigate("/")}><ArrowLeft size={17} /> Flight planner</button><div className="journey-wordmark">FocusFlight</div><button className="journey-signout" onClick={() => navigate("/journey")}>My Journey</button></header>
    {loading ? <section className="public-profile-state"><span className="selection-eyebrow">FocusFlight profile</span><h1>Opening this<br /><em>flight log…</em></h1></section> : error || !profile ? <section className="public-profile-state"><span className="selection-eyebrow">FocusFlight profile</span><h1>This flight log<br /><em>is unavailable.</em></h1><p>{error || "The traveller may have made their profile private or changed its handle."}</p><button className="journey-primary-button" onClick={() => navigate("/")}>Plan a focus flight</button></section> : <section className="public-profile-content">
      <span className="selection-eyebrow">Public flight log</span>
      <div className="public-profile-hero"><div><h1>{profile.display_name || `@${profile.handle}`}<br /><em>@{profile.handle}</em></h1>{profile.bio && <p>{profile.bio}</p>}{visibleLocation ? <div className="public-location"><MapPin size={15} /> Current solo location: <strong>{visibleLocation}</strong></div> : <p className="public-location-private">Current solo location is private.</p>}</div><div className="public-profile-identity"><Plane size={22} /><span>Pilot since</span><strong>{new Date(profile.pilot_since).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</strong></div></div>
      <section className="journey-stats public-profile-stats" aria-label="Public focus statistics"><div><span>Solo focus</span><strong>{formatDuration(profile.solo_completed_focus_seconds)}</strong><small>{profile.solo_completed_flights} completed flights</small></div><div><span>Co-Focus</span><strong>{formatDuration(profile.cofocus_completed_focus_seconds)}</strong><small>{profile.cofocus_completed_flights} completed group flights</small></div></section>
      <p className="public-profile-note">FocusFlight keeps solo and group history distinct. A group flight never changes this traveller’s solo location.</p>
    </section>}
  </main>;
}
