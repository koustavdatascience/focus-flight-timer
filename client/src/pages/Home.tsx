// Design philosophy: reference-inspired flight landing page — airy map canvas, quiet controls, centered focus ritual.
import { ArrowRight, Check, MapPin, Menu, Plane, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type RouteOption = {
  code: string;
  place: string;
  minutes: number;
};

const routes: RouteOption[] = [
  { code: "HND", place: "Haneda", minutes: 25 },
  { code: "LIS", place: "Lisbon", minutes: 40 },
  { code: "CPT", place: "Cape Town", minutes: 50 },
];

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<RouteOption>(routes[0]);
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(routes[0].minutes * 60);
  const [located, setLocated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const progressLabel = useMemo(() => {
    if (remaining === 0) return "Landed — take a good break.";
    if (running) return `${selectedRoute.place} is in progress`;
    return "Ready for departure";
  }, [remaining, running, selectedRoute.place]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  function chooseRoute(route: RouteOption) {
    setSelectedRoute(route);
    setRemaining(route.minutes * 60);
    setRunning(false);
    setNotice(`${route.place} route selected`);
  }

  function submitRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    const minutes = Number.parseInt(value, 10);
    const match = routes.find((route) => route.code.toLowerCase() === value.toLowerCase() || route.place.toLowerCase().includes(value.toLowerCase()));
    if (match) {
      chooseRoute(match);
      setQuery("");
      return;
    }
    if (Number.isFinite(minutes) && minutes > 0 && minutes <= 180) {
      const custom = { code: "CUS", place: "Custom route", minutes };
      chooseRoute(custom);
      setQuery("");
      return;
    }
    setNotice("Try a city, airport code, or a number up to 180");
  }

  function boardFlight() {
    setRunning((value) => !value);
    setNotice(running ? "Flight paused" : `Boarding ${selectedRoute.place}`);
  }

  function showNotice(message: string) {
    setNotice(message);
    setMenuOpen(false);
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
          <button onClick={() => showNotice("Your flight log will appear after your first landing")}>History</button>
          <button onClick={() => showNotice("Guest mode is ready — no sign in required")}>Sign In</button>
          <button onClick={() => showNotice("Co-focus rooms are coming soon")}>Co-Focus</button>
          <button onClick={() => showNotice("A calmer Pomodoro, framed as a short journey")}>About</button>
        </nav>
        <button className="mobile-menu-trigger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        {menuOpen && <div className="landing-mobile-menu"><button onClick={() => showNotice("Your flight log will appear after your first landing")}>History</button><button onClick={() => showNotice("Guest mode is ready — no sign in required")}>Sign In</button><button onClick={() => showNotice("Co-focus rooms are coming soon")}>Co-Focus</button><button onClick={() => showNotice("A calmer Pomodoro, framed as a short journey")}>About</button></div>}
      </header>

      <section className="flight-content" aria-labelledby="flight-title">
        <div className="flight-kicker"><Plane size={17} fill="currentColor" /><span>Pick a route,</span><strong>keep your focus.</strong></div>
        <h1 id="flight-title">Your next focus flight<br /><em>starts here.</em></h1>
        <div className="route-cards" aria-label="Focus routes">
          {routes.map((route) => <button key={route.code} className={`route-card-simple ${route.code === selectedRoute.code ? "active" : ""}`} onClick={() => chooseRoute(route)}><span className="route-code-simple">{route.code}</span><span className="route-place-simple">{route.place}</span><span className="route-minutes-simple">{route.minutes}min</span>{route.code === selectedRoute.code && <span className="selected-check"><Check size={12} /></span>}</button>)}
        </div>
        <div className="route-controls">
          <button className="choose-route-button" onClick={() => inputRef.current?.focus()}><span>Choose your route</span><ArrowRight size={15} /></button>
          <button className={`location-button ${located ? "located" : ""}`} aria-label="Use my location" onClick={() => { setLocated(true); setNotice("Location set — choose a route to depart"); }}><MapPin size={16} fill="currentColor" /></button>
        </div>
        <form className="destination-form" onSubmit={submitRoute}>
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search destination or enter duration in minutes (e.g. 30)" aria-label="Search destination or enter duration" />
          <button type="submit" aria-label="Set destination"><ArrowRight size={15} /></button>
        </form>
        <div className="flight-status" aria-live="polite">{notice || progressLabel}</div>
        <button className={`board-button ${running ? "running" : ""}`} onClick={boardFlight}>{running ? `Pause ${formatTime(remaining)}` : remaining === 0 ? "Board again" : `Start ${selectedRoute.minutes}-minute flight`}</button>
      </section>

      <footer className="landing-footer"><span>FocusFlight / a small ritual for deep work</span><span>Map art by FocusFlight</span></footer>
    </main>
  );
}
