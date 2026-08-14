import { ArrowLeft, Copy, DoorOpen, Plane, Plus, Radio, Users } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { getAirportById, searchAirports, type Destination } from "@/services/airportSearch";
import { getFlightDuration } from "@/services/flightDurations";
import { distanceBetween } from "@/services/route";
import {
  abandonGroupFlight, acceptGroupLocationSyncOffer, createFocusRoom, getGroupFlightRoster, getGroupLocationSyncOffers,
  getGroupTripHistory, getLatestGroupFlight, getMyFocusRooms, heartbeatGroupFlight, joinFocusRoom, setGroupFlightReady,
  startGroupFlight, type FocusRoom, type GroupFlightRosterMember, type GroupFlightSession, type GroupLocationSyncOffer, type GroupTrip,
} from "@/services/groupRooms";
import { formatGroupFlightClock, getGroupFlightRemainingSeconds, groupFlightStatusCopy } from "@/services/groupFlightState";
import { groupSyncOfferCopy } from "@/services/groupSyncOffers";

function airportLabel(airportId: string) {
  const airport = getAirportById(airportId);
  return airport ? `${airport.city} · ${airport.iata || airport.icao}` : airportId;
}

function AirportPicker({ label, value, onChange }: { label: string; value: Destination | null; onChange: (airport: Destination | null) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => query.trim() ? searchAirports(query).slice(0, 5) : [], [query]);
  return <label className="cofocus-picker"><span>{label}</span><input value={value ? `${value.city} · ${value.iata || value.icao}` : query} onChange={(event) => { setQuery(event.target.value); if (value) onChange(null); }} placeholder="Search a city or airport code" aria-label={label} />{results.length > 0 && <div className="cofocus-picker-results">{results.map((airport) => <button type="button" key={airport.id} onClick={() => { onChange(airport); setQuery(""); }}>{airport.city} <small>{airport.iata || airport.icao} · {airport.country}</small></button>)}</div>}</label>;
}

export default function CoFocus() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, isAuthenticated, signOut } = useSupabaseAuth();
  const [rooms, setRooms] = useState<FocusRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [session, setSession] = useState<GroupFlightSession | null>(null);
  const [roster, setRoster] = useState<GroupFlightRosterMember[]>([]);
  const [groupTrips, setGroupTrips] = useState<GroupTrip[]>([]);
  const [syncOffers, setSyncOffers] = useState<GroupLocationSyncOffer[]>([]);
  const [roomName, setRoomName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [origin, setOrigin] = useState<Destination | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const selectedRoom = useMemo(() => rooms.find((room) => room.id === selectedRoomId) ?? null, [rooms, selectedRoomId]);
  const me = user?.id ?? null;
  const myRosterEntry = roster.find((member) => member.user_id === me);
  const allPresent = roster.length > 0 && roster.every((member) => member.is_ready && member.is_present);

  const refresh = useCallback(async (roomId?: string | null) => {
    if (!isAuthenticated) return;
    const memberships = await getMyFocusRooms();
    const nextRooms = memberships.flatMap((membership) => membership.rooms ? [membership.rooms] : []);
    setRooms(nextRooms);
    const nextRoomId = roomId ?? selectedRoomId ?? nextRooms[0]?.id ?? null;
    setSelectedRoomId(nextRoomId);
    if (!nextRoomId) { setSession(null); setRoster([]); setGroupTrips([]); setSyncOffers([]); return; }
    const nextSession = await getLatestGroupFlight(nextRoomId);
    const nextTrips = await getGroupTripHistory(nextRoomId);
    setSession(nextSession);
    setRoster(nextSession ? await getGroupFlightRoster(nextSession.id) : []);
    setGroupTrips(nextTrips);
    setSyncOffers(await getGroupLocationSyncOffers(nextTrips.map((trip) => trip.session_id)));
  }, [isAuthenticated, selectedRoomId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { if (selectedRoomId) void refresh(selectedRoomId); }, [selectedRoomId]);

  useEffect(() => {
    if (!session || !selectedRoomId || session.status === "completed" || session.status === "abandoned") return;
    const pulse = () => void heartbeatGroupFlight(session.id, document.visibilityState === "visible").then(() => refresh(selectedRoomId)).catch(() => undefined);
    pulse();
    const timer = window.setInterval(pulse, 20_000);
    const visibilityListener = () => { if (document.visibilityState === "hidden") void heartbeatGroupFlight(session.id, false); };
    document.addEventListener("visibilitychange", visibilityListener);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visibilityListener); };
  }, [refresh, selectedRoomId, session]);

  async function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setNotice("");
    try { const roomId = await createFocusRoom(roomName); setRoomName(""); setNotice("Room created. Share the private boarding code with your crew."); await refresh(roomId); }
    catch (caught) { setNotice(caught instanceof Error ? caught.message : "We could not create that room."); }
    finally { setBusy(false); }
  }

  async function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setNotice("");
    try { const roomId = await joinFocusRoom(inviteCode); setInviteCode(""); setNotice("You joined the room. The active crew roster is now available."); await refresh(roomId); }
    catch (caught) { setNotice(caught instanceof Error ? caught.message : "We could not join that room."); }
    finally { setBusy(false); }
  }

  async function handleStartFlight() {
    if (!selectedRoom || !origin || !destination) { setNotice("Choose both airports for this shared flight."); return; }
    setBusy(true); setNotice("");
    try {
      const distanceKm = Math.round(distanceBetween(origin, destination));
      const duration = await getFlightDuration(origin, destination, distanceKm);
      const sessionId = await startGroupFlight({ roomId: selectedRoom.id, originAirportId: String(origin.id), destinationAirportId: String(destination.id), distanceKm, focusDurationSeconds: duration.durationSeconds });
      setNotice(`Boarding opened for ${origin.iata || origin.city} → ${destination.iata || destination.city}. Every room member must be ready before time begins.`);
      await refresh(selectedRoom.id);
      const started = await getLatestGroupFlight(selectedRoom.id);
      if (started?.id !== sessionId) await refresh(selectedRoom.id);
    } catch (caught) { setNotice(caught instanceof Error ? caught.message : "We could not open the group flight."); }
    finally { setBusy(false); }
  }

  async function toggleReady() {
    if (!session) return;
    setBusy(true);
    try { await setGroupFlightReady(session.id, !myRosterEntry?.is_ready); await refresh(selectedRoomId); }
    catch (caught) { setNotice(caught instanceof Error ? caught.message : "We could not update readiness."); }
    finally { setBusy(false); }
  }

  async function closeFlight() {
    if (!session || !window.confirm("Close this shared flight? It will be kept as abandoned and cannot be resumed.")) return;
    setBusy(true);
    try { await abandonGroupFlight(session.id); await refresh(selectedRoomId); }
    catch (caught) { setNotice(caught instanceof Error ? caught.message : "We could not close the group flight."); }
    finally { setBusy(false); }
  }

  async function acceptLocationSync(offer: GroupLocationSyncOffer) {
    setBusy(true); setNotice("");
    try {
      const outcome = await acceptGroupLocationSyncOffer(offer.id);
      setNotice(outcome === "used" ? `Your solo location is now ${airportLabel(offer.destination_airport_id)}. This remains separate from solo flight history.` : "That location option is no longer available because your solo journey changed.");
      await refresh(selectedRoomId);
    } catch (caught) { setNotice(caught instanceof Error ? caught.message : "We could not update your solo location."); }
    finally { setBusy(false); }
  }

  if (authLoading) return <main className="journey-page journey-gate"><span className="selection-eyebrow">Co-Focus</span><h1>Opening your<br /><em>crew board…</em></h1></main>;
  if (!isAuthenticated) return <main className="journey-page journey-gate"><span className="selection-eyebrow">Co-Focus rooms</span><h1>Focus together,<br /><em>after sign in.</em></h1><p>Group flights use a private shared roster. Sign in from the flight planner to create or join a room.</p><button className="journey-primary-button" onClick={() => navigate("/")}><ArrowLeft size={16} /> Return to Waypoint</button></main>;

  const status = session ? groupFlightStatusCopy(session.status) : null;
  const remaining = session ? getGroupFlightRemainingSeconds(session.focus_duration_seconds, session.elapsed_active_seconds) : 0;
  return <main className="journey-page cofocus-page">
    <header className="journey-header"><button className="journey-back-button" onClick={() => navigate("/")}><ArrowLeft size={17} /> Flight planner</button><div className="journey-wordmark">Waypoint</div><button className="journey-signout" onClick={() => void signOut()}>Sign out</button></header>
    <section className="journey-hero cofocus-hero"><div><span className="selection-eyebrow">Co-Focus rooms</span><h1>Bring the whole<br /><em>crew aboard.</em></h1><p>A group route is its own shared trail. It starts only when every current room member is ready and present, and it never changes anyone’s solo location.</p></div><div className="journey-profile-card cofocus-principle-card"><div className="profile-card-heading"><span>Shared-flight rule</span><Users size={16} /></div><strong>All members,<br />one clock.</strong><small><Radio size={13} /> A missing member pauses the route.</small></div></section>
    <section className="cofocus-layout">
      <aside className="cofocus-rooms-panel"><div className="journey-section-heading"><div><span className="selection-eyebrow">Your rooms</span><h2>Flight crews.</h2></div></div><div className="cofocus-room-list">{rooms.length ? rooms.map((room) => <button key={room.id} className={room.id === selectedRoomId ? "active" : ""} onClick={() => setSelectedRoomId(room.id)}><span>{room.name}</span><small>{room.id === selectedRoomId && session ? groupFlightStatusCopy(session.status).label : "Open crew"}</small></button>) : <p className="cofocus-empty-copy">Create a private room or use an invitation code to board with a crew.</p>}</div><form onSubmit={handleCreateRoom} className="cofocus-inline-form"><label>Create a room<input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="Night study crew" minLength={2} maxLength={60} required /></label><button className="journey-primary-button" disabled={busy}><Plus size={15} /> Create</button></form><form onSubmit={handleJoinRoom} className="cofocus-inline-form"><label>Join with code<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="AB12CD34" maxLength={8} required /></label><button type="submit" className="cofocus-secondary-button" disabled={busy}><DoorOpen size={14} /> Join</button></form></aside>
      <section className="cofocus-board">{selectedRoom ? <><div className="cofocus-room-heading"><div><span className="selection-eyebrow">Private room</span><h2>{selectedRoom.name}</h2><p>Boarding code <strong>{selectedRoom.invite_code}</strong><button className="cofocus-copy-button" onClick={() => { void navigator.clipboard?.writeText(selectedRoom.invite_code); setNotice("Boarding code copied."); }} aria-label="Copy room invitation code"><Copy size={13} /></button></p></div><div className="cofocus-member-count"><Users size={18} /><strong>{roster.length || "—"}</strong><span>crew members</span></div></div>
        {session && status ? <section className={`cofocus-session cofocus-session-${session.status}`}><div className="cofocus-session-status"><span>{status.label}</span><h3>{airportLabel(session.origin_airport_id)} <i /> {airportLabel(session.destination_airport_id)}</h3><p>{status.description}</p></div><div className="cofocus-clock"><span>Shared focus remaining</span><strong>{formatGroupFlightClock(remaining)}</strong><small>{session.status === "active" ? "All pilots are currently present" : `${roster.filter((member) => member.is_ready && member.is_present).length}/${roster.length} ready and present`}</small></div><div className="cofocus-session-actions">{session.status !== "completed" && session.status !== "abandoned" && <button className={myRosterEntry?.is_ready ? "cofocus-ready-button is-ready" : "journey-primary-button"} disabled={busy} onClick={() => void toggleReady()}>{myRosterEntry?.is_ready ? "Ready for takeoff" : "I’m ready"}</button>}{session.created_by === me && session.status !== "completed" && session.status !== "abandoned" && <button className="cofocus-text-button" disabled={busy} onClick={() => void closeFlight()}>Close this flight</button>}</div></section> : <section className="cofocus-planning"><div><span className="selection-eyebrow">Plan the next route</span><h3>Choose a shared origin and destination.</h3><p>The room owner opens boarding; every room member must then be ready and present before the shared timer moves.</p></div><div className="cofocus-route-pickers"><AirportPicker label="Starting airport" value={origin} onChange={setOrigin} /><AirportPicker label="Destination airport" value={destination} onChange={setDestination} /></div><button className="journey-primary-button" disabled={busy || !origin || !destination} onClick={() => void handleStartFlight()}><Plane size={15} fill="currentColor" /> Open boarding</button></section>}
        {session && <section className="cofocus-roster"><div className="journey-section-heading"><div><span className="selection-eyebrow">Current session roster</span><h2>Everyone flies or the clock waits.</h2></div><span>{allPresent ? "Ready for shared focus" : "Waiting for the full crew"}</span></div><div className="cofocus-roster-list">{roster.map((member, index) => <div key={member.user_id}><span className={member.is_ready && member.is_present ? "cofocus-presence online" : "cofocus-presence"} /><strong>{member.user_id === me ? "You" : `Crew member ${index + 1}`}</strong><small>{member.is_ready ? (member.is_present ? "ready and present" : "ready, reconnecting") : "not ready"}</small></div>)}</div></section>}
        <section className="cofocus-history"><div className="journey-section-heading"><div><span className="selection-eyebrow">Co-Focus history</span><h2>Shared flights, kept separate.</h2></div><span>{groupTrips.length ? `${groupTrips.length} completed` : "No completed flights yet"}</span></div><p className="cofocus-history-intro">These completed routes belong only to this group trail. They never appear in your solo journey or move your solo location automatically.</p>{groupTrips.length ? <div className="cofocus-history-list">{groupTrips.map((trip) => { const offer = syncOffers.find((candidate) => candidate.group_session_id === trip.session_id); const offerCopy = offer ? groupSyncOfferCopy(offer.status, airportLabel(offer.destination_airport_id)) : null; return <article key={trip.id} className="cofocus-history-item"><div><span>{new Date(trip.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span><h3>{airportLabel(trip.origin_airport_id)} <i /> {airportLabel(trip.destination_airport_id)}</h3><small>{formatGroupFlightClock(trip.focus_duration_seconds)} shared focus · {trip.distance_km.toLocaleString()} km</small></div>{offer && offerCopy ? <aside className={`cofocus-sync-offer is-${offer.status}`}><strong>{offerCopy.title}</strong><p>{offerCopy.description}</p>{offerCopy.action && <button className="cofocus-ready-button" disabled={busy} onClick={() => void acceptLocationSync(offer)}>{offerCopy.action}</button>}</aside> : <p className="cofocus-no-sync">No solo-location update was offered for this route.</p>}</article>; })}</div> : <div className="cofocus-history-empty">Complete a shared flight to create this room’s separate Co-Focus trail.</div>}</section>
      </> : <section className="cofocus-empty-board"><Plane size={28} /><h2>Choose a crew to begin.</h2><p>Your rooms will stay here between flights, ready for the next shared focus session.</p></section>}
      {notice && <p className="profile-message cofocus-notice" role="status">{notice}</p>}</section>
    </section>
  </main>;
}
