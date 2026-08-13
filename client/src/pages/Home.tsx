// Design philosophy: reference-inspired flight landing page — destination selection dissolves into an immersive map-first focus journey.
import { ArrowLeft, ChevronRight, Info, MapPin, Menu, Pause, Play, Plane, Volume2, VolumeX, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };
type Coordinate = { lat: number; lon: number };
type RouteOption = { code: string; place: string; minutes: number; coordinate: Coordinate; mapPoint: Point; center: Point };

const origin: RouteOption = { code: "SIN", place: "Singapore", minutes: 0, coordinate: { lat: 1.3521, lon: 103.8198 }, mapPoint: { x: 22, y: 76 }, center: { x: 50, y: 50 } };
const routes: RouteOption[] = [
  { code: "HND", place: "Haneda", minutes: 25, coordinate: { lat: 35.5494, lon: 139.7798 }, mapPoint: { x: 77, y: 23 }, center: { x: 70, y: 42 } },
  { code: "LIS", place: "Lisbon", minutes: 40, coordinate: { lat: 38.7742, lon: -9.1342 }, mapPoint: { x: 38, y: 28 }, center: { x: 43, y: 46 } },
  { code: "CPT", place: "Cape Town", minutes: 50, coordinate: { lat: -33.9715, lon: 18.6021 }, mapPoint: { x: 42, y: 77 }, center: { x: 38, y: 58 } },
];

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function formatCompactTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

function distanceBetween(a: Coordinate, b: Coordinate) {
  const radius = 6371;
  const radians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = radians(b.lat - a.lat);
  const deltaLon = radians(b.lon - a.lon);
  const haversine = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(deltaLon / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

function bezierPoint(start: Point, control: Point, end: Point, progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  const inverse = 1 - t;
  return { x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x, y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y };
}

function routeGeometry(destination: RouteOption) {
  const control = { x: (origin.mapPoint.x + destination.mapPoint.x) / 2, y: Math.min(origin.mapPoint.y, destination.mapPoint.y) - 14 };
  const path = `M ${origin.mapPoint.x} ${origin.mapPoint.y} Q ${control.x} ${control.y} ${destination.mapPoint.x} ${destination.mapPoint.y}`;
  return { control, path };
}

export default function Home() {
  const [activeFlight, setActiveFlight] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption>(routes[0]);
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [remaining, setRemaining] = useState(routes[0].minutes * 60);
  const [located, setLocated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const totalSeconds = selectedRoute.minutes * 60;
  const progress = totalSeconds === 0 ? 0 : 1 - remaining / totalSeconds;
  const { control, path } = routeGeometry(selectedRoute);
  const aircraftPoint = bezierPoint(origin.mapPoint, control, selectedRoute.mapPoint, progress);
  const routeDistance = distanceBetween(origin.coordinate, selectedRoute.coordinate);
  const progressLabel = remaining === 0 ? "Landed — take a good break." : running ? `${selectedRoute.place} is in progress` : "Ready for departure";

  useEffect(() => {
    if (!running || !activeFlight) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          setNotice(`${selectedRoute.place} reached — you made it.`);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeFlight, running, selectedRoute.place]);

  function launchFlight(route: RouteOption) {
    setSelectedRoute(route);
    setRemaining(route.minutes * 60);
    setRunning(true);
    setActiveFlight(true);
    setNotice("");
    setMenuOpen(false);
  }

  function returnToSelection() {
    setRunning(false);
    setActiveFlight(false);
    setNotice("");
  }

  function submitRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    const minutes = Number.parseInt(value, 10);
    const match = routes.find((route) => route.code.toLowerCase() === value.toLowerCase() || route.place.toLowerCase().includes(value.toLowerCase()));
    if (match) {
      launchFlight(match);
      setQuery("");
      return;
    }
    if (Number.isFinite(minutes) && minutes > 0 && minutes <= 180) {
      launchFlight({ code: "CUS", place: "Custom route", minutes, coordinate: { lat: 22, lon: 40 }, mapPoint: { x: 62, y: 33 }, center: { x: 55, y: 46 } });
      setQuery("");
      return;
    }
    setNotice("Try a city, airport code, or a number up to 180");
  }

  function showNotice(message: string) {
    setNotice(message);
    setMenuOpen(false);
  }

  const mapStyle = activeFlight ? { backgroundPosition: `${selectedRoute.center.x}% ${selectedRoute.center.y}%` } : undefined;

  if (activeFlight) {
    return (
      <main className="flight-landing flight-view">
        <div className="map-backdrop active-map" style={mapStyle} aria-hidden="true" />
        <div className="map-wash active-wash" aria-hidden="true" />
        <button className="flight-back-button" onClick={returnToSelection} aria-label="Back to destination selection"><ArrowLeft size={20} /></button>
        <div className="flight-top-controls" aria-label="Flight controls">
          <button className="flight-icon-button" onClick={() => setRunning((value) => !value)} aria-label={running ? "Pause flight" : "Resume flight"}>{running ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
          <button className={`flight-icon-button ${soundOn ? "selected" : ""}`} onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "Mute sound" : "Enable sound"}>{soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
          <button className="flight-icon-button" onClick={() => showNotice(`${origin.code} → ${selectedRoute.code} · ${routeDistance.toLocaleString()} km`)} aria-label="Show flight information"><Info size={17} /></button>
        </div>
        <div className="active-route-label origin-label"><span>{origin.code}</span><small>{origin.place}</small></div>
        <div className={`active-route-label destination-label ${remaining === 0 ? "arrived" : ""}`}><span>{selectedRoute.code}</span><small>{selectedRoute.place}</small></div>
        <div className="route-stage" aria-label={`Flight route from ${origin.place} to ${selectedRoute.place}`}>
          <svg className="route-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={path} pathLength="1" className="route-shadow" /><path d={path} pathLength="1" className="route-line" style={{ strokeDashoffset: 1 - progress }} /></svg>
          <span className="aircraft-progress" style={{ left: `${aircraftPoint.x}%`, top: `${aircraftPoint.y}%`, transform: `translate(-50%, -50%) rotate(${aircraftPoint.x < selectedRoute.mapPoint.x ? 26 : -26}deg)` }}><Plane size={19} fill="currentColor" /></span>
        </div>
        <div className="active-notice" aria-live="polite">{notice || progressLabel}</div>
        <div className="flight-stat-card time-card"><span>Time</span><strong>{formatCompactTime(remaining)}</strong><small>{running ? "in the air" : remaining === 0 ? "arrived" : "paused"}</small></div>
        <div className="flight-stat-card distance-card"><span>Distance</span><strong>{routeDistance.toLocaleString()} km</strong><small>{origin.code} → {selectedRoute.code}</small></div>
        <div className="active-attribution">Cartographic illustration by FocusFlight</div>
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
        {menuOpen && <div className="landing-mobile-menu"><button onClick={() => showNotice("Your flight log will appear after your first landing")}>History</button><button onClick={() => showNotice("Guest mode is ready — no sign in required")}>Sign In</button><button onClick={() => showNotice("Co-focus rooms are coming soon")}>Co-Focus</button><button onClick={() => showNotice("A calmer Pomodoro, framed as a short journey")}>About</button></div>}
      </header>
      <section className="flight-content" aria-labelledby="flight-title">
        <div className="flight-kicker"><Plane size={17} fill="currentColor" /><span>Pick a route,</span><strong>keep your focus.</strong></div>
        <h1 id="flight-title">Your next focus flight<br /><em>starts here.</em></h1>
        <div className="route-cards" aria-label="Focus routes">{routes.map((route) => <button key={route.code} className="route-card-simple" onClick={() => launchFlight(route)}><span className="route-code-simple">{route.code}</span><span className="route-place-simple">{route.place}</span><span className="route-minutes-simple">{route.minutes}min</span></button>)}</div>
        <div className="route-controls"><button className="choose-route-button" onClick={() => inputRef.current?.focus()}><span>Choose your route</span><ChevronRight size={15} /></button><button className={`location-button ${located ? "located" : ""}`} aria-label="Use my location" onClick={() => { setLocated(true); setNotice("Location set — choose a route to depart"); }}><MapPin size={16} fill="currentColor" /></button></div>
        <form className="destination-form" onSubmit={submitRoute}><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search destination or enter duration in minutes (e.g. 30)" aria-label="Search destination or enter duration" /><button type="submit" aria-label="Set destination"><ChevronRight size={15} /></button></form>
        <div className="flight-status" aria-live="polite">{notice || "Select a destination to begin your focus journey"}</div>
      </section>
      <footer className="landing-footer"><span>FocusFlight / a small ritual for deep work</span><span>Cartographic illustration by FocusFlight</span></footer>
    </main>
  );
}
