import { ArrowLeft, ArrowUpRight, Edit3, MapPin, Plane, Play, Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { JourneyMap, type JourneyRoute } from "@/components/map/JourneyMap";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useFocusJourney } from "@/hooks/useFocusJourney";
import { getAirportById } from "@/services/airportSearch";

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

export default function Journey() {
  const [, navigate] = useLocation();
  const { loading: authLoading, isAuthenticated, displayName, signOut } = useSupabaseAuth();
  const { profile, trips, loading, error, saveProfile } = useFocusJourney();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const completedTrips = useMemo(() => trips.filter((trip) => trip.status === "completed"), [trips]);
  const resumableTrips = useMemo(() => trips.filter((trip) => trip.status === "in_progress"), [trips]);
  const routes = useMemo<JourneyRoute[]>(() => completedTrips.flatMap((trip) => {
    const origin = getAirportById(trip.origin_airport_id);
    const destination = getAirportById(trip.destination_airport_id);
    return origin && destination ? [{ id: trip.id, origin, destination }] : [];
  }), [completedTrips]);
  const totalDistance = useMemo(() => completedTrips.reduce((total, trip) => total + trip.distance_km, 0), [completedTrips]);
  const totalFocus = useMemo(() => completedTrips.reduce((total, trip) => total + trip.focus_duration_seconds, 0), [completedTrips]);
  const airportVisits = useMemo(() => {
    const visits = new Map<string, number>();
    completedTrips.forEach((trip) => {
      [trip.origin_airport_id, trip.destination_airport_id].forEach((airportId) => visits.set(airportId, (visits.get(airportId) || 0) + 1));
    });
    return Array.from(visits, ([airportId, count]) => ({ airportId, count })).sort((a, b) => b.count - a.count);
  }, [completedTrips]);
  const mostVisitedAirport = airportVisits[0];
  const homeAirport = profile?.home_airport_id ? getAirportById(profile.home_airport_id) : null;

  function beginEditing() {
    setNameInput(profile?.display_name || displayName || "");
    setProfileMessage("");
    setEditing(true);
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setProfileMessage("");
    try {
      await saveProfile({ display_name: nameInput.trim() || null, home_airport_id: profile.home_airport_id });
      setProfileMessage("Profile updated.");
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
          <p>Every completed session becomes a quiet route on your personal map.</p>
        </div>
        <div className="journey-profile-card">
          <div className="profile-card-heading"><span>Profile</span><button onClick={beginEditing} aria-label="Edit profile"><Edit3 size={15} /></button></div>
          {editing ? <form onSubmit={saveName}><label>Display name<input value={nameInput} onChange={(event) => setNameInput(event.target.value)} maxLength={80} autoFocus /></label><div><button type="button" onClick={() => setEditing(false)}>Cancel</button><button className="profile-save" type="submit" disabled={saving}><Save size={14} /> {saving ? "Saving" : "Save"}</button></div></form> : <><strong>{profile?.display_name || displayName || "Traveller"}</strong><small><MapPin size={13} /> {homeAirport ? `${homeAirport.city} · ${airportCode(String(homeAirport.id))}` : "Home airport not selected yet"}</small></>}
          {profileMessage && <p className="profile-message" role="status">{profileMessage}</p>}
        </div>
      </section>
      <section className="journey-stats" aria-label="Journey totals">
        <div><span>Completed flights</span><strong>{completedTrips.length}</strong><small>focus sessions landed</small></div>
        <div><span>Distance covered</span><strong>{totalDistance.toLocaleString()} <em>km</em></strong><small>great-circle routes</small></div>
        <div><span>Time in focus</span><strong>{formatDuration(totalFocus)}</strong><small>across completed flights</small></div>
        <div><span>Airports visited</span><strong>{airportVisits.length}</strong><small>{mostVisitedAirport ? `${airportCode(mostVisitedAirport.airportId)} · ${mostVisitedAirport.count} route${mostVisitedAirport.count === 1 ? "" : "s"}` : "your route network"}</small></div>
      </section>
      {resumableTrips.length > 0 && <section className="resume-panel"><div><span className="selection-eyebrow">Paused flight</span><strong>{airportCode(resumableTrips[0].origin_airport_id)} → {airportCode(resumableTrips[0].destination_airport_id)}</strong><small>{Math.max(0, resumableTrips[0].focus_duration_seconds - resumableTrips[0].elapsed_seconds)} seconds remaining</small></div><button className="journey-primary-button" onClick={() => navigate(`/?resume=${resumableTrips[0].id}`)}><Play size={15} fill="currentColor" /> Resume flight</button></section>}
      <section className="journey-map-section">
        <div className="journey-section-heading"><div><span className="selection-eyebrow">My Journey map</span><h2>{routes.length ? "Routes made through focus." : "Your first route will appear here."}</h2></div><span className="journey-map-key"><i /> Completed flight path</span></div>
        <div className="journey-map-frame">{routes.length ? <JourneyMap routes={routes} /> : <div className="journey-map-empty"><Plane size={22} /><strong>No completed flights yet</strong><span>Choose two airports and finish a focus session to draw your first route.</span><button onClick={() => navigate("/")}>Plan a flight <ArrowUpRight size={15} /></button></div>}</div>
      </section>
      <section className="journey-history-section">
        <div className="journey-section-heading"><div><span className="selection-eyebrow">Flight history</span><h2>Recent landings.</h2></div><span>{loading ? "Loading…" : `${completedTrips.length} saved`}</span></div>
        {error && <div className="journey-error" role="alert">{error}</div>}
        {completedTrips.length ? <div className="journey-history-list">{completedTrips.map((trip) => <article key={trip.id} className="journey-history-item"><div className="history-route"><span>{airportCode(trip.origin_airport_id)}</span><i /><span>{airportCode(trip.destination_airport_id)}</span></div><div><strong>{trip.distance_km.toLocaleString()} km</strong><small>{formatDuration(trip.focus_duration_seconds)} focus</small></div><time dateTime={trip.completed_at || trip.started_at}>{new Date(trip.completed_at || trip.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time></article>)}</div> : <div className="journey-history-empty">Your completed flights will be recorded here after you land.</div>}
      </section>
    </main>
  );
}
