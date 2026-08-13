/* Cloud Atlas Editorial landing page: premium FocusFlight identity, real destination map, and timer-led journey. */

import { ArrowLeft, ChevronRight, Info, MapPin, Menu, Pause, Plane, Play, Search, Volume2, VolumeX, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FlightMap } from "@/components/map/FlightMap";
import { ORIGIN } from "@/config/origin";
import { geocodePlace } from "@/services/geocoding";
import { findNearestAirport, getFeaturedAirports, searchAirports, type Destination } from "@/services/airportSearch";
import { distanceBetween, suggestedFocusMinutes } from "@/services/route";

type ViewState = "landing" | "selecting" | "active";

const FEATURED_CODES = ["HND", "LIS", "CPT"];
const FEATURED_AIRPORTS = getFeaturedAirports(FEATURED_CODES);

function formatCompactTime(seconds: number) {
  return `${Math.floor(seconds / 60)}m ${(seconds % 60).toString().padStart(2, "0")}s`;
}

function airportLabel(airport: Destination) {
  return airport.iata || airport.icao || airport.city;
}

export default function Home() {
  const [view, setView] = useState<ViewState>("landing");
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [remaining, setRemaining] = useState(25 * 60);
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [located, setLocated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const localSuggestions = useMemo(() => searchAirports(query, 6), [query]);
  const routeDistance = selectedDestination ? distanceBetween(ORIGIN, selectedDestination) : 0;
  const totalSeconds = sessionMinutes * 60;
  const progress = totalSeconds === 0 ? 0 : 1 - remaining / totalSeconds;

  useEffect(() => {
    if (!running || view !== "active" || !selectedDestination) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          setNotice(`${selectedDestination.city} reached — you made it.`);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, selectedDestination?.city, view]);

  function selectDestination(destination: Destination) {
    const minutes = suggestedFocusMinutes(distanceBetween(ORIGIN, destination));
    setSelectedDestination(destination);
    setSessionMinutes(minutes);
    setRemaining(minutes * 60);
    setRunning(false);
    setView("selecting");
    setNotice(`${destination.city} selected — review the route, then begin your focus flight.`);
    setQuery("");
    setMenuOpen(false);
  }

  function startFlight() {
    if (!selectedDestination) return;
    setRemaining(sessionMinutes * 60);
    setRunning(true);
    setView("active");
    setNotice("");
  }

  function returnToLanding() {
    setRunning(false);
    setSelectedDestination(null);
    setSessionMinutes(25);
    setRemaining(25 * 60);
    setView("landing");
    setNotice("");
  }

  function returnToSelection() {
    setRunning(false);
    setView("selecting");
    setNotice("");
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    const localMatch = searchAirports(value, 1)[0];
    if (localMatch) {
      selectDestination(localMatch);
      return;
    }

    const customMinutes = Number.parseInt(value, 10);
    if (Number.isFinite(customMinutes) && customMinutes > 0 && customMinutes <= 180) {
      setSessionMinutes(customMinutes);
      setRemaining(customMinutes * 60);
      setView("selecting");
      setNotice(selectedDestination ? `Custom focus duration set for ${selectedDestination.city}.` : "Custom focus duration set. Choose a destination to depart.");
      setQuery("");
      if (!selectedDestination) setView("landing");
      return;
    }

    setSearching(true);
    try {
      const geocoded = await geocodePlace(value);
      if (geocoded[0]) {
        selectDestination(geocoded[0]);
      } else {
        setNotice("No place found. Try a city, airport name, IATA code, or ICAO code.");
      }
    } catch {
      setNotice("Search is temporarily unavailable. Try one of the airport cards instead.");
    } finally {
      setSearching(false);
    }
  }

  function showNotice(message: string) {
    setNotice(message);
    setMenuOpen(false);
  }

  function handleMapClick(coordinate: { latitude: number; longitude: number }) {
    const nearest = findNearestAirport(coordinate.latitude, coordinate.longitude);
    if (nearest) {
      selectDestination(nearest);
      return;
    }
    setNotice("No commercial airport nearby. Search by city or airport code to set a destination.");
  }

  function renderSearchForm(className = "destination-form") {
    return (
      <div className="search-stack">
        <form className={className} onSubmit={submitSearch}>
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city, airport, IATA or ICAO code" aria-label="Search city or airport" />
          <button type="submit" aria-label="Search destination" disabled={searching}>{searching ? <span className="search-spinner" /> : <ChevronRight size={15} />}</button>
        </form>
        {query.trim() && localSuggestions.length > 0 && <div className="airport-suggestions" role="listbox" aria-label="Matching airports">
          {localSuggestions.map((airport) => <button key={`${airport.id}`} type="button" onClick={() => selectDestination(airport)} role="option"><span><strong>{airportLabel(airport)}</strong><small>{airport.city}, {airport.country}</small></span><ChevronRight size={14} /></button>)}
        </div>}
      </div>
    );
  }

  if (view === "active" && selectedDestination) {
    return (
      <main className="geo-flight-shell active-flight-shell">
        <FlightMap origin={ORIGIN} destination={selectedDestination} progress={progress} mode="active" onMapClick={handleMapClick} />
        <button className="flight-back-button" onClick={returnToSelection} aria-label="Back to destination selection"><ArrowLeft size={20} /></button>
        <div className="flight-top-controls" aria-label="Flight controls">
          <button className="flight-icon-button" onClick={() => setRunning((value) => !value)} aria-label={running ? "Pause flight" : "Resume flight"}>{running ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
          <button className={`flight-icon-button ${soundOn ? "selected" : ""}`} onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "Mute sound" : "Enable sound"}>{soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
          <button className="flight-icon-button" onClick={() => showNotice(`${ORIGIN.iata} → ${airportLabel(selectedDestination)} · ${routeDistance.toLocaleString()} km`)} aria-label="Show flight information"><Info size={17} /></button>
        </div>
        <div className="active-notice" aria-live="polite">{notice || (remaining === 0 ? "Landed — take a good break." : running ? `${selectedDestination.city} is in progress` : "Flight paused")}</div>
        <div className="flight-stat-card time-card"><span>Time</span><strong>{formatCompactTime(remaining)}</strong><small>{running ? "in the air" : remaining === 0 ? "arrived" : "paused"}</small></div>
        <div className="flight-stat-card distance-card"><span>Distance</span><strong>{routeDistance.toLocaleString()} km</strong><small>{ORIGIN.iata} → {airportLabel(selectedDestination)}</small></div>
      </main>
    );
  }

  if (view === "selecting" && selectedDestination) {
    return (
      <main className="geo-flight-shell selecting-flight-shell">
        <FlightMap origin={ORIGIN} destination={selectedDestination} progress={0} mode="selecting" onMapClick={handleMapClick} />
        <button className="flight-back-button" onClick={returnToLanding} aria-label="Back to landing page"><ArrowLeft size={20} /></button>
        <div className="selection-map-search">{renderSearchForm("destination-form map-search-form")}</div>
        <div className="selection-destination-card">
          <span className="selection-eyebrow">Destination selected</span>
          <strong>{airportLabel(selectedDestination)} <em>{selectedDestination.city}</em></strong>
          <span>{selectedDestination.name}</span>
          <small>{routeDistance.toLocaleString()} km from {ORIGIN.city} · {sessionMinutes} minute focus flight</small>
          <button className="start-flight-button" onClick={startFlight}>Start focus flight <Plane size={15} fill="currentColor" /></button>
        </div>
      </main>
    );
  }

  return (
    <main className="flight-landing">
      <div className="map-backdrop" aria-hidden="true" />
      <div className="map-wash" aria-hidden="true" />
      <div className="map-pin pin-one" aria-hidden="true" />
      <div className="map-pin pin-two" aria-hidden="true" />
      <header className="landing-header">
        <button className="landing-wordmark" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>FocusFlight</button>
        <nav className="landing-nav" aria-label="Landing page navigation">
          <button onClick={() => showNotice("Your flight log will appear after your first landing")}>History</button><button onClick={() => showNotice("Guest mode is ready — no sign in required")}>Sign In</button><button onClick={() => showNotice("Co-focus rooms are coming soon")}>Co-Focus</button><button onClick={() => showNotice("A calmer Pomodoro, framed as a short journey")}>About</button>
        </nav>
        <button className="mobile-menu-trigger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        {menuOpen && <div className="landing-mobile-menu"><button onClick={() => showNotice("Your flight log will appear after your first landing")}>History</button><button onClick={() => showNotice("Guest mode is ready — no sign in required")}>Guest mode is ready — no sign in required</button><button onClick={() => showNotice("Co-focus rooms are coming soon")}>Co-Focus</button><button onClick={() => showNotice("A calmer Pomodoro, framed as a short journey")}>About</button></div>}
      </header>
      <section className="flight-content" aria-labelledby="flight-title">
        <div className="flight-kicker"><Plane size={17} fill="currentColor" /><span>Pick a route,</span><strong>keep your focus.</strong></div>
        <h1 id="flight-title">Your next focus flight<br /><em>starts here.</em></h1>
        <div className="route-cards" aria-label="Focus routes">{FEATURED_AIRPORTS.map((airport) => <button key={`${airport.id}`} className="route-card-simple" onClick={() => selectDestination(airport)}><span className="route-code-simple">{airportLabel(airport)}</span><span className="route-place-simple">{airport.city}</span><span className="route-minutes-simple">{suggestedFocusMinutes(distanceBetween(ORIGIN, airport))}min</span></button>)}</div>
        <div className="route-controls"><button className="choose-route-button" onClick={() => inputRef.current?.focus()}><span>Choose your route</span><ChevronRight size={15} /></button><button className={`location-button ${located ? "located" : ""}`} aria-label="Use my location" onClick={() => { setLocated(true); setNotice("Location set — choose a destination to depart"); }}><MapPin size={16} fill="currentColor" /></button></div>
        {renderSearchForm()}
        <div className="flight-status" aria-live="polite">{notice || "Select a destination to open the geographic flight map"}</div>
      </section>
      <footer className="landing-footer"><span>FocusFlight / a small ritual for deep work</span><span>Illustrated landing · live map after selection</span></footer>
    </main>
  );
}
