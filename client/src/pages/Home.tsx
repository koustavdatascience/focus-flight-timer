// Cloud Atlas Editorial page: an explicit-airport focus ritual on a real map, with sourced or transparent estimated flight durations.
import { ArrowLeft, ChevronRight, Download, Info, MapPin, Menu, Pause, Plane, Play, Printer, Radio, Scissors, Search, Shuffle, Ticket, Volume2, VolumeX, X } from "lucide-react";
import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AuthDialog, type AuthDialogMode } from "@/components/auth/AuthDialog";
import { FlightMap } from "@/components/map/FlightMap";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useFocusJourney } from "@/hooks/useFocusJourney";
import { useWaypointPresence } from "@/hooks/useWaypointPresence";
import { completeFocusTrip, startFocusTrip, updateFocusTripProgress, type FocusTrip } from "@/lib/supabase";
import { estimateFlightDuration, formatFlightClock, formatFlightDuration, getFlightDuration, pickRandomDestination, pickRandomDestinationForDuration, pickRandomOrigin, type FlightDuration } from "@/services/flightDurations";
import { geocodePlace } from "@/services/geocoding";
import { AIRPORTS, findNearestAirport, getAirportById, searchAirports, type Destination } from "@/services/airportSearch";
import { distanceBetween } from "@/services/route";
import { getLatestCompletedTrip } from "@/services/tripHistory";
import { createFocusTripInput } from "@/services/tripPersistence";
import { getSimulatedTravelerCount } from "@/services/simulatedPresence";
import { getDestinationBrief } from "@/services/destinationFacts";
import { createWaypointTicket, type WaypointTicket } from "@/services/onboardingTicket";
import { downloadWaypointTicket } from "@/services/ticketExport";

type ViewState = "landing" | "selecting" | "onboarding" | "active";
type SearchMode = "origin" | "destination";

function formatCompactTime(seconds: number) {
  return formatFlightClock(seconds);
}

function airportLabel(airport: Destination) {
  return airport.iata || airport.icao || airport.city;
}

export default function Home() {
  const [location, navigate] = useLocation();
  const { user, displayName, isAuthenticated, loading: authLoading, signOut } = useSupabaseAuth();
  const { trips, refresh: refreshJourney, saveProfile } = useFocusJourney();
  const [view, setView] = useState<ViewState>("landing");
  const [selectedOrigin, setSelectedOrigin] = useState<Destination | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>("origin");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [remaining, setRemaining] = useState(0);
  const [routeDuration, setRouteDuration] = useState<FlightDuration | null>(null);
  const [durationLoading, setDurationLoading] = useState(false);
  const [randomFocusMinutes, setRandomFocusMinutes] = useState(60);
  const [randomRouteSummary, setRandomRouteSummary] = useState("");
  const [located, setLocated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<AuthDialogMode>("signin");
  const [activeTrip, setActiveTrip] = useState<FocusTrip | null>(null);
  const [persistingTrip, setPersistingTrip] = useState(false);
  const [completionRecorded, setCompletionRecorded] = useState(false);
  const [lastSelectedLocation, setLastSelectedLocation] = useState<Destination | null>(null);
  const [shufflePulse, setShufflePulse] = useState<{ target: SearchMode; nonce: number } | null>(null);
  const [onboardingTicket, setOnboardingTicket] = useState<WaypointTicket | null>(null);
  const [ticketEntering, setTicketEntering] = useState(false);
  const [tearingTicket, setTearingTicket] = useState(false);
  const [tearProgress, setTearProgress] = useState(0);
  const [draggingTear, setDraggingTear] = useState(false);
  const [simulatedTravelers, setSimulatedTravelers] = useState(() => getSimulatedTravelerCount());
  const inputRef = useRef<HTMLInputElement>(null);
  const tearLineRef = useRef<HTMLDivElement>(null);
  const tearDragRef = useRef<{ pointerId: number; startX: number; width: number; moved: boolean } | null>(null);
  const suppressTearClickRef = useRef(false);
  const tearTimerRef = useRef<number | null>(null);
  const resumedTripId = useRef<string | null>(null);
  const localSuggestions = useMemo(() => searchAirports(query, 6), [query]);
  const routeDistance = selectedOrigin && selectedDestination ? distanceBetween(selectedOrigin, selectedDestination) : 0;
  const totalSeconds = routeDuration?.durationSeconds ?? 0;
  const progress = totalSeconds === 0 ? 0 : 1 - remaining / totalSeconds;
  const latestCompletedTrip = useMemo(() => getLatestCompletedTrip(trips), [trips]);
  const landingMapDestination = useMemo(() => latestCompletedTrip ? getAirportById(latestCompletedTrip.destination_airport_id) : null, [latestCompletedTrip]);
  const destinationBrief = selectedDestination ? getDestinationBrief(selectedDestination) : null;
  const livePresence = useWaypointPresence(view === "active" && running ? "flying" : "exploring");
  const liveActivity = (
    <aside className={`live-activity-card ${view === "active" ? "active-flight-activity" : ""}`} aria-live="polite" aria-label="Estimated Waypoint activity">
      <Radio size={14} aria-hidden="true" />
      <span><strong>{simulatedTravelers}</strong> estimated travelers here <small>simulated</small> <i>·</i> <strong>{livePresence.connected ? livePresence.flyers : 0}</strong> flying</span>
    </aside>
  );

  useEffect(() => {
    const updateSimulatedTravelers = () => setSimulatedTravelers(getSimulatedTravelerCount());
    updateSimulatedTravelers();
    const interval = window.setInterval(updateSimulatedTravelers, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const authAction = new URLSearchParams(location.split("?")[1] || window.location.search).get("auth");
    if (authAction !== "reset") return;
    setAuthDialogMode("update-password");
    setAuthDialogOpen(true);
    navigate("/", { replace: true });
  }, [location, navigate]);

  useEffect(() => {
    const tripId = new URLSearchParams(location.split("?")[1] || window.location.search).get("resume");
    if (!isAuthenticated || !tripId || resumedTripId.current === tripId) return;
    const savedTrip = trips.find((trip) => trip.id === tripId && trip.status === "in_progress");
    if (!savedTrip) return;
    const origin = getAirportById(savedTrip.origin_airport_id);
    const destination = getAirportById(savedTrip.destination_airport_id);
    if (!origin || !destination) {
      setNotice("This saved flight cannot be restored because an airport record is unavailable.");
      return;
    }
    resumedTripId.current = tripId;
    setSelectedOrigin(origin);
    setSelectedDestination(destination);
    setLastSelectedLocation(destination);
    setRouteDuration({
      routeKey: savedTrip.flight_duration_route_key || `${airportLabel(origin)}-${airportLabel(destination)}`,
      durationSeconds: savedTrip.focus_duration_seconds,
      source: savedTrip.duration_source || "estimated",
      sourceLabel: savedTrip.duration_source_label || "Saved flight duration",
      sourceUrl: null,
      isDirect: savedTrip.duration_source === "verified_direct",
    });
    setRemaining(Math.max(1, savedTrip.focus_duration_seconds - savedTrip.elapsed_seconds));
    setActiveTrip(savedTrip);
    setCompletionRecorded(false);
    setRunning(false);
    setView("active");
    setNotice(`Paused flight restored — ${destination.city} is waiting.`);
    navigate("/", { replace: true });
  }, [isAuthenticated, location, navigate, trips]);

  useEffect(() => {
    if (!running || view !== "active" || !selectedOrigin || !selectedDestination || totalSeconds === 0) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          if (activeTrip && !completionRecorded) {
            setCompletionRecorded(true);
            void completeFocusTrip(activeTrip.id, totalSeconds)
              .then(() => refreshJourney())
              .then(() => setNotice(`${selectedDestination.city} reached — this flight is saved to My Journey.`))
              .catch(() => setNotice(`${selectedDestination.city} reached — we could not save this flight just now.`));
          } else {
            setNotice(`${selectedDestination.city} reached — you made it.`);
          }
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeTrip, completionRecorded, refreshJourney, running, selectedDestination?.city, selectedOrigin?.city, totalSeconds, view]);

  useEffect(() => {
    if (!activeTrip || !running || remaining === 0 || totalSeconds === 0) return;
    const elapsedSeconds = totalSeconds - remaining;
    if (elapsedSeconds <= 0 || elapsedSeconds % 5 !== 0) return;
    void updateFocusTripProgress(activeTrip.id, elapsedSeconds, false).catch(() => {
      setNotice("Your flight continues, but progress is not syncing at the moment.");
    });
  }, [activeTrip, remaining, running, totalSeconds]);

  function selectOrigin(origin: Destination) {
    setSelectedOrigin(origin);
    setLastSelectedLocation(origin);
    setSelectedDestination(null);
    setRouteDuration(null);
    setRandomRouteSummary("");
    setDurationLoading(false);
    setSearchMode("destination");
    setLocated(false);
    setRemaining(0);
    setRunning(false);
    setView("landing");
    setNotice(`${origin.city} set as your starting airport. Now choose a destination.`);
    setQuery("");
    setMenuOpen(false);
    if (isAuthenticated) {
      void saveProfile({ display_name: displayName, home_airport_id: String(origin.id) }).catch(() => {
        setNotice(`${origin.city} is ready, but we could not update your home airport.`);
      });
    }
  }

  async function selectDestination(destination: Destination, randomSummary = "", originOverride?: Destination, transitionToSelection = true) {
    const origin = originOverride ?? selectedOrigin;
    if (!origin) {
      setSearchMode("origin");
      setNotice("Choose a starting airport before selecting a destination.");
      return;
    }
    const distance = distanceBetween(origin, destination);
    setSelectedOrigin(origin);
    setSelectedDestination(destination);
    setLastSelectedLocation(destination);
    setRandomRouteSummary(randomSummary);
    setRouteDuration(null);
    setDurationLoading(true);
    setRemaining(0);
    setRunning(false);
    if (transitionToSelection) setView("selecting");
    setNotice(`Checking the flight duration for ${destination.city}…`);
    setQuery("");
    setMenuOpen(false);
    try {
      const duration = await getFlightDuration(origin, destination, distance);
      setRouteDuration(duration);
      setRemaining(duration.durationSeconds);
      setNotice(`${destination.city} selected — ${duration.source === "verified_direct" ? "direct-flight duration found" : "estimated duration prepared"}.`);
    } catch {
      const estimate = estimateFlightDuration(distance);
      setRouteDuration(estimate);
      setRemaining(estimate.durationSeconds);
      setNotice(`${destination.city} selected — using a transparent flight-duration estimate.`);
    } finally {
      setDurationLoading(false);
    }
  }

  function startFlight() {
    if (!selectedOrigin || !selectedDestination || !routeDuration || durationLoading || totalSeconds <= 0) return;
    setRemaining(routeDuration.durationSeconds);
    setRunning(true);
    setTearingTicket(false);
    setTearProgress(0);
    setDraggingTear(false);
    tearDragRef.current = null;
    setView("active");
    setNotice("");
    setActiveTrip(null);
    setCompletionRecorded(false);

    if (!user) {
      setNotice("Guest flight in progress — sign in next time to save your journey.");
      return;
    }

    setPersistingTrip(true);
    void startFocusTrip(createFocusTripInput({
      userId: user.id,
      origin: selectedOrigin,
      destination: selectedDestination,
      distanceKm: routeDistance,
      duration: routeDuration,
    }))
      .then((trip) => setActiveTrip(trip))
      .catch(() => setNotice("Your flight has started, but it could not be saved right now."))
      .finally(() => setPersistingTrip(false));
  }

  function completeTicketTear() {
    if (!onboardingTicket || tearingTicket) return;
    if (tearTimerRef.current !== null) window.clearTimeout(tearTimerRef.current);
    setTearProgress(1);
    setDraggingTear(false);
    setTearingTicket(true);
    tearTimerRef.current = window.setTimeout(() => {
      tearTimerRef.current = null;
      startFlight();
    }, 820);
  }

  function handleTearPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (tearingTicket) return;
    const line = tearLineRef.current;
    if (!line) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    tearDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      width: Math.max(line.clientWidth - 46, 160),
      moved: false,
    };
    setDraggingTear(true);
  }

  function handleTearPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = tearDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || tearingTicket) return;
    const distance = Math.max(0, drag.startX - event.clientX);
    if (distance > 6) drag.moved = true;
    const nextProgress = Math.min(1, distance / drag.width);
    setTearProgress(nextProgress);
    if (nextProgress >= 0.96) completeTicketTear();
  }

  function handleTearPointerEnd(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = tearDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    suppressTearClickRef.current = drag.moved;
    if (!tearingTicket && tearProgress < 0.96) {
      setDraggingTear(false);
      setTearProgress(0);
    }
    tearDragRef.current = null;
    if (drag.moved) window.setTimeout(() => { suppressTearClickRef.current = false; }, 0);
  }

  function handleTearClick() {
    if (suppressTearClickRef.current) return;
    completeTicketTear();
  }

  function saveTicketImage() {
    if (!onboardingTicket) return;
    downloadWaypointTicket(onboardingTicket);
  }

  function printTicket() {
    window.print();
  }

  function pauseAndSyncActiveTrip() {
    if (activeTrip && remaining > 0) {
      void updateFocusTripProgress(activeTrip.id, totalSeconds - remaining, true).catch(() => undefined);
    }
  }

  function returnToLanding() {
    pauseAndSyncActiveTrip();
    setRunning(false);
    setSelectedOrigin(null);
    setSelectedDestination(null);
    setRouteDuration(null);
    setDurationLoading(false);
    setSearchMode("origin");
    setRemaining(0);
    setOnboardingTicket(null);
    setTicketEntering(false);
    setTearingTicket(false);
    setTearProgress(0);
    setDraggingTear(false);
    tearDragRef.current = null;
    setView("landing");
    setNotice("");
    setActiveTrip(null);
  }

  function returnToSelection() {
    pauseAndSyncActiveTrip();
    setRunning(false);
    setOnboardingTicket(null);
    setTicketEntering(false);
    setTearingTicket(false);
    setTearProgress(0);
    setDraggingTear(false);
    tearDragRef.current = null;
    setView("selecting");
    setNotice("");
  }

  function toggleFlightRunning() {
    const nextRunning = !running;
    setRunning(nextRunning);
    if (activeTrip) {
      void updateFocusTripProgress(activeTrip.id, totalSeconds - remaining, !nextRunning).catch(() => {
        setNotice("Your flight continues, but progress is not syncing at the moment.");
      });
    }
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    const localMatch = searchAirports(value, 1)[0];
    if (localMatch) {
      if (searchMode === "origin") selectOrigin(localMatch);
      else await selectDestination(localMatch);
      return;
    }

    setSearching(true);
    try {
      const geocoded = await geocodePlace(value);
      if (geocoded[0]) {
        if (searchMode === "origin") selectOrigin(geocoded[0]);
        else await selectDestination(geocoded[0]);
      } else {
        setNotice(searchMode === "origin" ? "No starting airport found. Try a city, airport name, IATA code, or ICAO code." : "No destination found. Try a city, airport name, IATA code, or ICAO code.");
      }
    } catch {
      setNotice("Search is temporarily unavailable. Try an airport card or search again shortly.");
    } finally {
      setSearching(false);
    }
  }

  function showNotice(message: string) {
    setNotice(message);
    setMenuOpen(false);
  }

  function pulseShuffle(target: SearchMode) {
    setShufflePulse((current) => ({ target, nonce: (current?.nonce ?? 0) + 1 }));
  }

  function cycleRandomOrigin() {
    const randomOrigin = pickRandomOrigin(AIRPORTS);
    if (!randomOrigin) {
      setNotice("No eligible starting airport is available just now. Try again shortly.");
      return;
    }
    pulseShuffle("origin");
    selectOrigin(randomOrigin);
  }

  function cycleRandomDestination() {
    if (!selectedOrigin) {
      setNotice("Choose a starting airport first, then browse destination options.");
      return;
    }
    const randomDestination = pickRandomDestination(selectedOrigin, AIRPORTS);
    if (!randomDestination) {
      setNotice("No eligible destination is available just now. Try again shortly.");
      return;
    }
    pulseShuffle("destination");
    void selectDestination(randomDestination, "", undefined, false);
  }

  function beginOnboarding() {
    if (!selectedOrigin || !selectedDestination || !routeDuration || durationLoading) return;
    setOnboardingTicket(createWaypointTicket(selectedOrigin, selectedDestination, routeDuration.durationSeconds));
    setTicketEntering(true);
    setTearingTicket(false);
    setNotice("");
    setView("onboarding");
  }

  function openLocationSearch(mode: SearchMode) {
    if (mode === "destination" && !selectedOrigin) {
      setSearchMode("origin");
      setNotice("Choose a starting airport before choosing a destination.");
    } else {
      setSearchMode(mode);
      setNotice(mode === "origin" ? "Choose a starting airport." : "Choose a destination.");
    }
    setQuery("");
    setMenuOpen(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleMapClick(coordinate: { latitude: number; longitude: number }) {
    const nearest = findNearestAirport(coordinate.latitude, coordinate.longitude);
    if (nearest) {
      void selectDestination(nearest);
      return;
    }
    setNotice("No commercial airport nearby. Search by city or airport code to set a destination.");
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setNotice("Location access is unavailable. Search for a starting airport instead.");
      return;
    }
    setNotice("Finding the nearest airport…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearest = findNearestAirport(coords.latitude, coords.longitude);
        if (nearest) {
          setLocated(true);
          selectOrigin(nearest);
        } else {
          setNotice("No commercial airport nearby. Search for a starting airport instead.");
        }
      },
      () => setNotice("Location permission was not granted. Search for a starting airport instead."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  function continueFromLastDestination() {
    if (!latestCompletedTrip) return;
    const lastDestination = getAirportById(latestCompletedTrip.destination_airport_id);
    if (!lastDestination) {
      setNotice("Your last destination is not available in the current airport catalogue.");
      return;
    }
    selectOrigin(lastDestination);
    setNotice(`Continuing from ${lastDestination.city}. Choose your next destination.`);
  }

  async function generateRandomDestination() {
    const targetSeconds = randomFocusMinutes * 60;
    if (!selectedOrigin) {
      const randomOrigin = pickRandomOrigin(AIRPORTS);
      if (!randomOrigin) {
        setNotice("No eligible starting airport is available just now. Try again shortly.");
        return;
      }
      selectOrigin(randomOrigin);
      setNotice(`Random start set to ${randomOrigin.city}. Now choose a destination for your ${formatFlightDuration(targetSeconds)} focus time.`);
      return;
    }

    const match = pickRandomDestinationForDuration(selectedOrigin, targetSeconds, AIRPORTS);
    if (!match) {
      setNotice("No eligible airport matches that focus duration just now. Try another time.");
      return;
    }
    const summary = `Random route for a ${formatFlightDuration(targetSeconds)} focus target — initial match ${formatFlightDuration(match.duration.durationSeconds)}, ${Math.round(match.durationDifferenceSeconds / 60)} minutes away.`;
    await selectDestination(match.destination, summary, undefined, false);
    setNotice(`Suggestion ready: ${selectedOrigin.city} → ${match.destination.city} is a close match for your ${formatFlightDuration(targetSeconds)} focus target. Browse another option or confirm when ready.`);
  }

  function renderSearchForm(className = "destination-form", mode: SearchMode = searchMode) {
    const isOriginSearch = mode === "origin";
    return (
      <div className="search-stack">
        <form className={className} onSubmit={submitSearch}>
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isOriginSearch ? "Search starting city, airport, IATA or ICAO" : "Search destination city, airport, IATA or ICAO"} aria-label={isOriginSearch ? "Search starting airport" : "Search destination"} />
          <button type="submit" aria-label={isOriginSearch ? "Search starting airport" : "Search destination"} disabled={searching}>{searching ? <span className="search-spinner" /> : <ChevronRight size={15} />}</button>
        </form>
        {query.trim() && localSuggestions.length > 0 && <div className="airport-suggestions" role="listbox" aria-label={isOriginSearch ? "Matching starting airports" : "Matching destinations"}>
          {localSuggestions.map((airport) => <button key={`${airport.id}`} type="button" onClick={() => { if (isOriginSearch) selectOrigin(airport); else void selectDestination(airport); }} role="option"><span><strong>{airportLabel(airport)}</strong><small>{airport.city}, {airport.country}</small></span><ChevronRight size={14} /></button>)}
        </div>}
      </div>
    );
  }

  if (view === "active" && selectedOrigin && selectedDestination) {
    return (
      <main className="geo-flight-shell active-flight-shell">
        <FlightMap origin={selectedOrigin} destination={selectedDestination} progress={progress} mode="active" onMapClick={handleMapClick} />
        <button className="flight-back-button" onClick={returnToSelection} aria-label="Back to destination selection"><ArrowLeft size={20} /></button>
        <div className="flight-top-controls" aria-label="Flight controls">
          <button className="flight-icon-button" onClick={toggleFlightRunning} aria-label={running ? "Pause flight" : "Resume flight"}>{running ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
          <button className={`flight-icon-button ${soundOn ? "selected" : ""}`} onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "Mute sound" : "Enable sound"}>{soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
          <button className="flight-icon-button" onClick={() => showNotice(`${selectedOrigin.iata || selectedOrigin.icao} → ${airportLabel(selectedDestination)} · ${routeDistance.toLocaleString()} km · ${routeDuration ? formatFlightDuration(routeDuration.durationSeconds) : "duration pending"}`)} aria-label="Show flight information"><Info size={17} /></button>
        </div>
        <div className="active-notice" aria-live="polite">{notice || (persistingTrip ? "Saving this flight…" : remaining === 0 ? "Landed — take a good break." : running ? `${selectedDestination.city} is in progress` : "Flight paused")}</div>
        <div className="flight-stat-card time-card"><span>Time</span><strong>{formatCompactTime(remaining)}</strong><small>{running ? "in the air" : remaining === 0 ? "arrived" : "paused"}</small></div>
        <div className="flight-stat-card distance-card"><span>Distance</span><strong>{routeDistance.toLocaleString()} km</strong><small>{airportLabel(selectedOrigin)} → {airportLabel(selectedDestination)}</small></div>
        {destinationBrief && <aside className="destination-brief-card" aria-label={`About ${destinationBrief.title}`}>
          <span className="destination-brief-eyebrow">{destinationBrief.sourceLabel}</span>
          <strong>On your way to {destinationBrief.title}</strong>
          <p>{destinationBrief.fact}</p>
        </aside>}
        {liveActivity}
      </main>
    );
  }

  if (view === "onboarding" && selectedOrigin && selectedDestination && routeDuration && onboardingTicket) {
    return (
      <main className="geo-flight-shell onboarding-shell">
        <FlightMap origin={selectedOrigin} destination={selectedDestination} progress={0} mode="selecting" />
        <button className="flight-back-button" onClick={returnToSelection} aria-label="Back to route review"><ArrowLeft size={20} /></button>
        <section className={`onboarding-ticket ${ticketEntering ? "ticket-entering" : ""} ${tearingTicket ? "is-tearing" : ""}`} onAnimationEnd={(event) => { if (event.animationName === "ticket-entrance") setTicketEntering(false); }} aria-labelledby="onboarding-ticket-title">
          <div className="ticket-header-row">
            <span className="ticket-overline"><Ticket size={14} aria-hidden="true" /> Waypoint focus flight</span>
            <span className="ticket-trip-code">{onboardingTicket.tripCode}</span>
          </div>
          <h1 id="onboarding-ticket-title">Your focus flight</h1>
          <div className="ticket-flight-line"><strong>{onboardingTicket.flightNumber}</strong><span>{formatFlightDuration(onboardingTicket.durationSeconds)} in the air</span></div>
          <div className="ticket-route-line">
            <div><span>From</span><strong>{onboardingTicket.originCode}</strong><small>{onboardingTicket.originCity}</small></div>
            <span className="ticket-route-arrow">→</span>
            <div><span>To</span><strong>{onboardingTicket.destinationCode}</strong><small>{onboardingTicket.destinationCity}</small></div>
          </div>
          <div className="ticket-detail-grid">
            <div><span>Departure</span><strong>{onboardingTicket.departureAt}</strong><small>{onboardingTicket.originTimezone}</small></div>
            <div><span>Arrival</span><strong>{onboardingTicket.arrivalAt}</strong><small>{onboardingTicket.destinationTimezone}</small></div>
            <div><span>Gate</span><strong>{onboardingTicket.gate}</strong><small>Focus room</small></div>
            <div><span>Seat</span><strong>{onboardingTicket.seat}</strong><small>Quiet cabin</small></div>
          </div>
          <div className={`ticket-perforation-wrap ${draggingTear ? "is-dragging" : ""}`} ref={tearLineRef}>
            <div className="ticket-tear-progress" style={{ width: `${Math.max(0, tearProgress * 100)}%` }} aria-hidden="true" />
            <span className="ticket-perforation-label"><Scissors size={14} aria-hidden="true" /> {tearingTicket ? "Ticket released" : "Drag to tear"}</span>
            <button className="ticket-tear-handle" style={{ left: `calc((100% - 44px) * ${1 - tearProgress})` }} type="button" onClick={handleTearClick} onPointerDown={handleTearPointerDown} onPointerMove={handleTearPointerMove} onPointerUp={handleTearPointerEnd} onPointerCancel={handleTearPointerEnd} disabled={tearingTicket} aria-label="Drag the tear handle to begin the focus flight">
              <span className="ticket-tear-knob" aria-hidden="true" />
            </button>
          </div>
          <div className={`ticket-boarding-section ${tearingTicket ? "is-falling" : ""}`}>
            <span className="ticket-boarding-label">Boarding pass</span>
            <strong>Boarding begins {onboardingTicket.boardingAt}</strong>
            <div className="ticket-barcode" aria-label={`Waypoint ticket ${onboardingTicket.tripCode}`} role="img" />
            <small>Unique focus ticket · not an airline boarding pass</small>
          </div>
          <div className="ticket-save-actions" aria-label="Save your Waypoint ticket">
            <button type="button" className="ticket-save-button" onClick={saveTicketImage}><Download size={14} aria-hidden="true" /> Save image</button>
            <button type="button" className="ticket-save-button" onClick={printTicket}><Printer size={14} aria-hidden="true" /> Print / PDF</button>
          </div>
        </section>
        <div className="ticket-helper-text">Drag the handle across the perforation when you are ready to leave the map behind. Tap it if you are on a touchscreen.</div>
      </main>
    );
  }

  if (view === "selecting" && selectedOrigin && selectedDestination) {
    return (
      <main className="geo-flight-shell selecting-flight-shell">
        <FlightMap origin={selectedOrigin} destination={selectedDestination} progress={0} mode="selecting" onMapClick={handleMapClick} />
        <button className="flight-back-button" onClick={returnToLanding} aria-label="Back to landing page"><ArrowLeft size={20} /></button>
        <div className="selection-map-search">{renderSearchForm("destination-form map-search-form", "destination")}</div>
        <div className="selection-destination-card">
          <span className="selection-eyebrow">Route selected</span>
          <strong>{airportLabel(selectedDestination)} <em>{selectedDestination.city}</em></strong>
          <span>{selectedDestination.name}</span>
          <small>{airportLabel(selectedOrigin)} → {airportLabel(selectedDestination)} · {routeDistance.toLocaleString()} km · {durationLoading ? "checking duration…" : routeDuration ? `${formatFlightDuration(routeDuration.durationSeconds)} ${routeDuration.source === "verified_direct" ? "direct flight" : "estimated flight"}` : "duration unavailable"}</small>
          {routeDuration && <p className="duration-provenance">{routeDuration.sourceUrl ? <a href={routeDuration.sourceUrl} target="_blank" rel="noreferrer">{routeDuration.sourceLabel}</a> : routeDuration.sourceLabel}</p>}
          {randomRouteSummary && <p className="random-route-summary">{randomRouteSummary}</p>}
          <button className="start-flight-button" onClick={beginOnboarding} disabled={!routeDuration || durationLoading}>{durationLoading ? "Preparing route…" : "Begin onboarding"} <Ticket size={15} /></button>
        </div>
      </main>
    );
  }

  return (
    <main className="flight-landing">
      <div className="landing-map-layer"><FlightMap mode="landing" landingFocus={lastSelectedLocation ?? landingMapDestination} /></div>
      <div className="map-wash" aria-hidden="true" />
      <header className="landing-header">
        <button className="landing-wordmark" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Waypoint</button>
        <nav className="landing-nav" aria-label="Landing page navigation">
          {isAuthenticated && <button onClick={() => navigate("/journey")}>My Journey</button>}
          {authLoading ? <span className="nav-status">Connecting…</span> : isAuthenticated ? <button onClick={() => void signOut()}>Sign out</button> : <button onClick={() => { setAuthDialogMode("signin"); setAuthDialogOpen(true); }}>Sign In</button>}
          <button onClick={() => navigate("/cofocus")}>Co-Focus</button><button onClick={() => navigate("/leaderboards")}>Rankings</button><button onClick={() => navigate("/about")}>About</button>
        </nav>
        <button className="mobile-menu-trigger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        {menuOpen && <div className="landing-mobile-menu">{isAuthenticated && <button onClick={() => navigate("/journey")}>My Journey</button>}{isAuthenticated ? <button onClick={() => void signOut()}>Sign out</button> : <button onClick={() => { setAuthDialogMode("signin"); setAuthDialogOpen(true); }}>Sign in</button>}<button onClick={() => navigate("/cofocus")}>Co-Focus</button><button onClick={() => navigate("/leaderboards")}>Rankings</button><button onClick={() => navigate("/about")}>About</button></div>}
      </header>
      <section className="flight-content" aria-labelledby="flight-title">
        <div className="flight-kicker"><Plane size={17} fill="currentColor" /><span>{selectedOrigin ? "Choose a destination," : "Choose a starting airport,"}</span><strong>keep your focus.</strong></div>
        <h1 id="flight-title">Your next focus flight<br /><em>starts here.</em></h1>
        <div className="route-cards route-cards-two" aria-label="Starting location and destination">
          <button className={`route-card-simple route-location-card ${selectedOrigin ? "active" : ""} ${shufflePulse?.target === "origin" ? `shuffle-pulse-${shufflePulse.nonce % 2 === 0 ? "a" : "b"}` : ""}`} onClick={cycleRandomOrigin} aria-label="Cycle through random starting airports">
            <span className="route-card-label">Starting location <small>click to shuffle</small></span>
            <span className="route-code-simple">{selectedOrigin ? airportLabel(selectedOrigin) : "FROM"}</span>
            <span className="route-place-simple">{selectedOrigin ? selectedOrigin.city : "Pick origin"}</span>
          </button>
          <button className={`route-card-simple route-location-card ${selectedDestination ? "active" : ""} ${shufflePulse?.target === "destination" ? `shuffle-pulse-${shufflePulse.nonce % 2 === 0 ? "a" : "b"}` : ""}`} onClick={cycleRandomDestination} aria-label="Cycle through random destinations">
            <span className="route-card-label">Destination <small>click to shuffle</small></span>
            <span className="route-code-simple">{selectedDestination ? airportLabel(selectedDestination) : "TO"}</span>
            <span className="route-place-simple">{selectedDestination ? `${selectedDestination.city}${routeDuration ? ` · ${formatFlightDuration(routeDuration.durationSeconds)}` : ""}` : "Pick destination"}</span>
          </button>
        </div>
        <div className="route-controls route-controls-compact"><button className={`location-button ${located ? "located" : ""}`} aria-label="Use my location as starting airport" onClick={handleUseMyLocation}><MapPin size={16} fill="currentColor" /></button></div>
        <div className="random-route-generator" aria-label="Random route generator">
          <label>
            <span>How long do you have?</span>
            <select value={randomFocusMinutes} onChange={(event) => setRandomFocusMinutes(Number(event.target.value))} aria-label="Preferred focus duration">
              <option value={45}>45 minutes</option><option value={60}>1 hour</option><option value={90}>1 hour 30 minutes</option><option value={120}>2 hours</option><option value={180}>3 hours</option><option value={240}>4 hours</option><option value={360}>6 hours</option><option value={480}>8 hours</option>
            </select>
          </label>
          <button className="random-route-button" type="button" onClick={() => void generateRandomDestination()}><Shuffle size={15} aria-hidden="true" /><span>Find a place</span></button>
        </div>
        {renderSearchForm()}
        <div className="flight-status" aria-live="polite">{notice || (selectedOrigin ? selectedDestination ? "Review your route, or browse another option before confirming." : "Select a destination to open the geographic flight map" : landingMapDestination ? `Your map is centred on your latest arrival: ${landingMapDestination.city}.` : "The live map is centred on New York City. Pick an airport or let Waypoint choose a starting airport.")}</div>
        {selectedOrigin && selectedDestination && routeDuration && <button className="continue-journey-button route-confirm-button" type="button" onClick={beginOnboarding} disabled={durationLoading}>Begin onboarding <Ticket size={15} /></button>}
        {latestCompletedTrip && <button className="continue-journey-button" type="button" onClick={continueFromLastDestination}>Continue from your last destination <ChevronRight size={15} /></button>}
      </section>
      <footer className="landing-footer"><span>Waypoint / a small ritual for deep work</span><nav aria-label="Footer navigation"><button onClick={() => navigate("/about")}>About</button><button onClick={() => navigate("/changelog")}>Changelog</button><button onClick={() => navigate("/feedback")}>Feedback</button><button onClick={() => navigate("/privacy")}>Privacy</button><button onClick={() => navigate("/terms")}>Terms</button></nav></footer>
      {liveActivity}
      <AuthDialog open={authDialogOpen} initialMode={authDialogMode} onOpenChange={setAuthDialogOpen} />
    </main>
  );
}
