import { ArrowLeft, ArrowUpRight, Edit3, MapPin, Plane, Play, Save } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { JourneyMap, type JourneyRoute } from "@/components/map/JourneyMap";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useFocusJourney } from "@/hooks/useFocusJourney";
import { getAirportById } from "@/services/airportSearch";
import { getHandleIssue, normalizeHandle } from "@/services/profileIdentity";
import { getSoloProfileStats } from "@/services/profileStats";

function formatDuration(totalSeconds: number) {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function airportCode(id: string) {
  const airport = getAirportById(id);
  return airport?.iata || airport?.icao || airport?.city || "—";
}

function airportLabel(id: string | null) {
  if (!id) return "No solo landing recorded yet";
  const airport = getAirportById(id);
  return airport ? `${airport.city} · ${airportCode(id)}` : id;
}

export default function Journey() {
  const [, navigate] = useLocation();
  const { loading: authLoading, isAuthenticated, displayName, signOut } = useSupabaseAuth();
  const { profile, trips, loading, error, saveProfile } = useFocusJourney();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [locationVisibility, setLocationVisibility] = useState<"only_me" | "shared_rooms" | "public">("only_me");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(false);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const completedTrips = useMemo(() => trips.filter((trip) => trip.status === "completed"), [trips]);
  const resumableTrips = useMemo(() => trips.filter((trip) => trip.status === "in_progress"), [trips]);
  const routes = useMemo<JourneyRoute[]>(() => completedTrips.flatMap((trip) => {
    const origin = getAirportById(trip.origin_airport_id);
    const destination = getAirportById(trip.destination_airport_id);
    return origin && destination ? [{ id: trip.id, origin, destination, distanceKm: trip.distance_km, focusDurationSeconds: trip.focus_duration_seconds, completedAt: trip.completed_at }] : [];
  }), [completedTrips]);
  const soloStats = useMemo(() => getSoloProfileStats(trips), [trips]);
  const airportVisits = useMemo(() => {
    const visits = new Map<string, number>();
    completedTrips.forEach((trip) => {
      [trip.origin_airport_id, trip.destination_airport_id].forEach((airportId) => visits.set(airportId, (visits.get(airportId) || 0) + 1));
    });
    return Array.from(visits, ([airportId, count]) => ({ airportId, count })).sort((a, b) => b.count - a.count);
  }, [completedTrips]);
  const mostVisitedAirport = airportVisits[0];

  function beginEditing() {
    setNameInput(profile?.display_name || displayName || "");
    setHandleInput(profile?.handle || "");
    setBioInput(profile?.bio || "");
    setLocationVisibility(profile?.location_visibility || "only_me");
    setPublicProfileEnabled(profile?.public_profile_enabled || false);
    setLeaderboardOptIn(profile?.leaderboard_opt_in ?? true);
    setProfileMessage("");
    setEditing(true);
  }

  async function saveIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const handle = normalizeHandle(handleInput);
    const handleIssue = getHandleIssue(handle);
    if (handleIssue) {
      setProfileMessage(handleIssue);
      return;
    }
    if (publicProfileEnabled && !handle) {
      setProfileMessage("Choose a handle before making your profile public.");
      return;
    }
    setSaving(true);
    setProfileMessage("");
    try {
      await saveProfile({
        display_name: nameInput.trim() || null,
        home_airport_id: profile.home_airport_id,
        handle: handle || null,
        bio: bioInput.trim() || null,
        location_visibility: locationVisibility,
        leaderboard_opt_in: leaderboardOptIn,
        public_profile_enabled: publicProfileEnabled,
      });
      setProfileMessage("Flight identity and privacy settings updated.");
      setEditing(false);
    } catch (caught) {
      setProfileMessage(caught instanceof Error ? caught.message : "We could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return <main className="journey-page journey-gate"><span className="selection-eyebrow">FocusFlight</span><h1>Opening your journey…</h1></main>;
  }

  if (!isAuthenticated) {
    return <main className="journey-page journey-gate"><span className="selection-eyebrow">FocusFlight account</span><h1>Your personal map<br /><em>awaits a sign in.</em></h1><p>Return to the flight planner to create an account or sign in, then every completed focus flight will appear here.</p><button className="journey-primary-button" onClick={() => navigate("/")}><ArrowLeft size={16} /> Return to FocusFlight</button></main>;
  }

  return (
    <main className="journey-page">
      <header className="journey-header">
        <button className="journey-back-button" onClick={() => navigate("/")}><ArrowLeft size={17} /> Flight planner</button>
        <div className="journey-wordmark">FocusFlight</div>
        <button className="journey-signout" onClick={() => void signOut()}>Sign out</button>
      </header>
      <section className="journey-hero">
        <div>
          <span className="selection-eyebrow">Personal flight log</span>
          <h1>{profile?.display_name || displayName || "Traveller"},<br /><em>your focus has travelled.</em></h1>
          <p>Solo sessions build your personal map. Group flights remain a separate shared trail and never move this location.</p>
        </div>
        <div className="journey-profile-card">
          <div className="profile-card-heading"><span>Flight identity</span><button onClick={beginEditing} aria-label="Edit profile and privacy"><Edit3 size={15} /></button></div>
          <strong>{profile?.display_name || displayName || "Traveller"}</strong>
          <small>{profile?.handle ? `@${profile.handle}` : "Choose a handle to share your profile"}</small>
          <small><MapPin size={13} /> Your solo location: {airportLabel(profile?.solo_current_airport_id || null)}</small>
          {profile?.public_profile_enabled && profile.handle && <button className="profile-public-link" onClick={() => navigate(`/u/${profile.handle}`)}>View public profile <ArrowUpRight size={13} /></button>}
        </div>
      </section>
      {editing && <section className="journey-account-section" aria-labelledby="identity-settings-heading">
        <div className="journey-section-heading"><div><span className="selection-eyebrow">Account settings</span><h2 id="identity-settings-heading">Identity, discovery, and privacy.</h2></div><button className="journey-close-settings" type="button" onClick={() => setEditing(false)}>Close</button></div>
        <form className="journey-identity-form" onSubmit={saveIdentity}>
          <label>Display name<input value={nameInput} onChange={(event) => setNameInput(event.target.value)} maxLength={80} autoFocus /></label>
          <label>Public handle<input value={handleInput} onChange={(event) => setHandleInput(event.target.value)} placeholder="sky_pilot" maxLength={20} autoCapitalize="none" /><small>Your public profile uses lowercase letters, numbers, and underscores.</small></label>
          <label className="journey-form-wide">Short bio<textarea value={bioInput} onChange={(event) => setBioInput(event.target.value)} placeholder="A few words about how you focus." maxLength={280} rows={3} /><small>{bioInput.length}/280</small></label>
          <label>Solo location visibility<select value={locationVisibility} onChange={(event) => setLocationVisibility(event.target.value as "only_me" | "shared_rooms" | "public")}><option value="only_me">Only me</option><option value="shared_rooms">People in shared rooms</option><option value="public">Public</option></select><small>Your location changes only after a completed solo flight.</small></label>
          <div className="journey-switches"><label><input type="checkbox" checked={publicProfileEnabled} onChange={(event) => setPublicProfileEnabled(event.target.checked)} /> <span><b>Public profile</b><small>Let anyone open your profile using your handle.</small></span></label><label><input type="checkbox" checked={leaderboardOptIn} onChange={(event) => setLeaderboardOptIn(event.target.checked)} /> <span><b>Leaderboard participation</b><small>Show completed focus time in rankings. You can opt out any time.</small></span></label></div>
          <div className="journey-form-actions"><button type="button" onClick={() => setEditing(false)}>Cancel</button><button className="journey-primary-button" type="submit" disabled={saving}><Save size={14} /> {saving ? "Saving" : "Save settings"}</button></div>
          {profileMessage && <p className="profile-message journey-form-message" role="status">{profileMessage}</p>}
        </form>
      </section>}
      <section className="journey-stats" aria-label="Solo journey totals">
        <div><span>Completed flights</span><strong>{soloStats.completedFlights}</strong><small>solo focus sessions landed</small></div>
        <div><span>Time in focus</span><strong>{formatDuration(soloStats.totalFocusSeconds)}</strong><small>completed solo focus</small></div>
        <div><span>Distance covered</span><strong>{soloStats.totalDistanceKm.toLocaleString()} <em>km</em></strong><small>great-circle routes</small></div>
        <div><span>Active streak</span><strong>{soloStats.activeStreakDays} <em>days</em></strong><small>{mostVisitedAirport ? `frequent stop: ${airportCode(mostVisitedAirport.airportId)}` : "complete a flight to begin"}</small></div>
      </section>
      {resumableTrips.length > 0 && <section className="resume-panel"><div><span className="selection-eyebrow">Paused flight</span><strong>{airportCode(resumableTrips[0].origin_airport_id)} → {airportCode(resumableTrips[0].destination_airport_id)}</strong><small>{Math.max(0, resumableTrips[0].focus_duration_seconds - resumableTrips[0].elapsed_seconds)} seconds remaining</small></div><button className="journey-primary-button" onClick={() => navigate(`/?resume=${resumableTrips[0].id}`)}><Play size={15} fill="currentColor" /> Resume flight</button></section>}
      <section className="journey-map-section">
        <div className="journey-section-heading"><div><span className="selection-eyebrow">My Journey map</span><h2>{routes.length ? "Routes made through focus." : "Your first route will appear here."}</h2></div><span className="journey-map-key"><i /> Completed solo flight path</span></div>
        <div className="journey-map-frame">{routes.length ? <JourneyMap routes={routes} /> : <div className="journey-map-empty"><Plane size={22} /><strong>No completed solo flights yet</strong><span>Choose two airports and finish a focus session to draw your first route.</span><button onClick={() => navigate("/")}>Plan a flight <ArrowUpRight size={15} /></button></div>}</div>
      </section>
      <section className="journey-history-section">
        <div className="journey-section-heading"><div><span className="selection-eyebrow">Solo flight history</span><h2>Recent landings.</h2></div><span>{loading ? "Loading…" : `${completedTrips.length} saved`}</span></div>
        {error && <div className="journey-error" role="alert">{error}</div>}
        {completedTrips.length ? <div className="journey-history-list">{completedTrips.map((trip) => <article key={trip.id} className="journey-history-item"><div className="history-route"><span>{airportCode(trip.origin_airport_id)}</span><i /><span>{airportCode(trip.destination_airport_id)}</span></div><div><strong>{trip.distance_km.toLocaleString()} km</strong><small>{formatDuration(trip.focus_duration_seconds)} focus</small></div><time dateTime={trip.completed_at || trip.started_at}>{new Date(trip.completed_at || trip.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time></article>)}</div> : <div className="journey-history-empty">Your completed solo flights will be recorded here after you land.</div>}
      </section>
    </main>
  );
}
