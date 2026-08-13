// Design philosophy: Cloud Atlas Editorial — offset editorial layout, map lines, paper texture, and a warm boarding ritual.
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Compass,
  History as HistoryIcon,
  MapPin,
  Menu,
  Pause,
  Plane,
  Play,
  RotateCcw,
  Settings2,
  TimerReset,
  Volume2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type TimerMode = "focus" | "short" | "long";
type RouteOption = {
  code: string;
  place: string;
  region: string;
  minutes: number;
  stamp: string;
  description: string;
};

const routes: RouteOption[] = [
  { code: "SEA", place: "Seattle", region: "PACIFIC NORTHWEST", minutes: 25, stamp: "01", description: "A clear first leg for getting into motion." },
  { code: "MEX", place: "Mexico City", region: "CENTRAL PLATEAU", minutes: 50, stamp: "02", description: "A long-haul route for uninterrupted deep work." },
  { code: "LIS", place: "Lisbon", region: "ATLANTIC EDGE", minutes: 40, stamp: "03", description: "A measured middle distance for creative focus." },
];

const modeLabels: Record<TimerMode, { eyebrow: string; label: string; minutes: number }> = {
  focus: { eyebrow: "IN FLIGHT", label: "Focus leg", minutes: 25 },
  short: { eyebrow: "QUICK LAYOVER", label: "Short break", minutes: 5 },
  long: { eyebrow: "LONG LAYOVER", label: "Long break", minutes: 15 },
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.max(0, seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function getInitialSeconds(mode: TimerMode, route: RouteOption) {
  return mode === "focus" ? route.minutes * 60 : modeLabels[mode].minutes * 60;
}

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<RouteOption>(routes[0]);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [remaining, setRemaining] = useState(getInitialSeconds("focus", routes[0]));
  const [isRunning, setIsRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [history, setHistory] = useState<Array<{ route: string; minutes: number; finishedAt: string }>>([]);

  const totalSeconds = getInitialSeconds(mode, selectedRoute);
  const progress = Math.max(0, Math.min(1, 1 - remaining / totalSeconds));
  const activeMode = modeLabels[mode];

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          setIsRunning(false);
          setHistory((items) => [
            { route: selectedRoute.place, minutes: Math.round(totalSeconds / 60), finishedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
            ...items,
          ].slice(0, 6));
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, selectedRoute.place, totalSeconds]);

  const statusCopy = useMemo(() => {
    if (remaining === 0) return "Landed — nice work.";
    if (isRunning) return `Your ${selectedRoute.place} leg is underway.`;
    return "Ready when you are.";
  }, [isRunning, remaining, selectedRoute.place]);

  function applyRoute(route: RouteOption) {
    setSelectedRoute(route);
    setMode("focus");
    setRemaining(route.minutes * 60);
    setIsRunning(false);
  }

  function applyMode(nextMode: TimerMode) {
    setMode(nextMode);
    setRemaining(getInitialSeconds(nextMode, selectedRoute));
    setIsRunning(false);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    const minutes = Number.parseInt(value, 10);
    if (Number.isFinite(minutes) && minutes > 0 && minutes <= 180) {
      const custom = { code: "CUS", place: "Custom route", region: "YOUR OWN HORIZON", minutes, stamp: "04", description: "A route tuned to the time you have today." };
      applyRoute(custom);
      setQuery("");
      return;
    }
    const match = routes.find((route) => route.place.toLowerCase().includes(value.toLowerCase()) || route.code.toLowerCase() === value.toLowerCase());
    if (match) {
      applyRoute(match);
      setQuery("");
    }
  }

  function resetTimer() {
    setRemaining(getInitialSeconds(mode, selectedRoute));
    setIsRunning(false);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="FocusFlight home">
          <span className="brand-mark"><Compass size={20} strokeWidth={1.8} /></span>
          <span className="brand-name"><b>Focus</b><span>Flight</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <button onClick={() => setShowHistory(true)}><HistoryIcon size={15} /> History</button>
          <a href="#method">The method</a>
          <a href="#about">About</a>
        </nav>
        <div className="header-actions">
          <button className="quiet-button desktop-only" onClick={() => setShowSettings(true)}><Settings2 size={16} /> Settings</button>
          <button className="menu-button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <button onClick={() => { setShowHistory(true); setMenuOpen(false); }}><HistoryIcon size={16} /> History</button>
            <a href="#method" onClick={() => setMenuOpen(false)}>The method <ArrowUpRight size={15} /></a>
            <a href="#about" onClick={() => setMenuOpen(false)}>About <ArrowUpRight size={15} /></a>
            <button onClick={() => { setShowSettings(true); setMenuOpen(false); }}><Settings2 size={16} /> Settings</button>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-art" aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-rail">
              <span className="eyebrow">FLIGHT CARD  /  01</span>
              <span className="rail-rule" />
              <span className="rail-caption">A small ritual for<br />the work ahead.</span>
            </div>
            <div className="hero-copy">
              <p className="hero-kicker"><Plane size={16} /> A calmer way to go deep</p>
              <h1>Choose a route.<br /><em>Keep your eyes</em><br />on the horizon.</h1>
              <p className="hero-intro">FocusFlight turns a simple Pomodoro into a short journey — with enough atmosphere to make starting feel easy.</p>
              <a className="text-link" href="#board">Board your next leg <ChevronRight size={16} /></a>
            </div>
            <div className="hero-stamp" aria-label="FocusFlight route stamp">
              <span>FOCUS / FLIGHT</span>
              <strong>FF</strong>
              <small>DEEP WORK DEPT.<br />SINCE 2025</small>
            </div>
          </div>
          <div className="hero-bottom-note"><span>41° 23′ N</span><span className="dotted-line" /><span>03° 42′ W</span></div>
        </section>

        <section id="board" className="board-section">
          <div className="section-intro">
            <span className="eyebrow">BOARDING DESK  /  SELECT A LEG</span>
            <h2>Where will you<br /><em>focus today?</em></h2>
            <p>Pick the distance that matches your energy. You can also enter any number of minutes and make your own route.</p>
          </div>

          <div className="board-content">
            <div className="route-grid" aria-label="Focus route options">
              {routes.map((route) => (
                <button key={route.code} className={`route-card ${selectedRoute.code === route.code ? "selected" : ""}`} onClick={() => applyRoute(route)}>
                  <div className="route-card-top"><span className="route-stamp">{route.stamp}</span><MapPin size={16} /></div>
                  <span className="route-code">{route.code}</span>
                  <span className="route-place">{route.place}</span>
                  <span className="route-region">{route.region}</span>
                  <span className="route-duration">{route.minutes}<small> min</small></span>
                  <span className="route-card-footer">{selectedRoute.code === route.code ? <><Check size={14} /> selected</> : "choose route"}<ChevronRight size={15} /></span>
                </button>
              ))}
            </div>
            <form className="route-search" onSubmit={handleSearch}>
              <label htmlFor="route-input"><MapPin size={17} /> Make your own route</label>
              <div className="search-control">
                <input id="route-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a city or enter minutes (e.g. 35)" />
                <button type="submit" aria-label="Set custom route"><ArrowUpRight size={18} /></button>
              </div>
              <span className="search-hint">Try “Lisbon”, “MEX”, or any duration up to 180 minutes.</span>
            </form>
          </div>
        </section>

        <section className="timer-section" aria-label="Pomodoro timer">
          <div className="timer-aside">
            <span className="eyebrow">CURRENT ROUTE</span>
            <div className="aside-route"><span>{selectedRoute.code}</span><b>{selectedRoute.place}</b><small>{selectedRoute.region}</small></div>
            <p>{selectedRoute.description}</p>
            <div className="aside-meta"><span>DEPARTURE</span><b>{isRunning ? "NOW" : "ON YOUR MARK"}</b></div>
            <div className="aside-meta"><span>ARRIVAL IN</span><b>{formatTime(remaining)}</b></div>
          </div>
          <div className="timer-card">
            <div className="timer-card-header"><span className="eyebrow">FOCUS CONTROL  /  {activeMode.eyebrow}</span><button className="icon-button" onClick={() => setShowSettings(true)} aria-label="Open timer settings"><Settings2 size={17} /></button></div>
            <div className="mode-switcher" role="tablist" aria-label="Timer mode">
              {(Object.keys(modeLabels) as TimerMode[]).map((item) => <button key={item} role="tab" aria-selected={mode === item} className={mode === item ? "active" : ""} onClick={() => applyMode(item)}>{modeLabels[item].label}</button>)}
            </div>
            <div className="timer-display-wrap">
              <svg className="timer-ring" viewBox="0 0 260 260" aria-hidden="true">
                <circle className="ring-track" cx="130" cy="130" r="108" />
                <circle className="ring-progress" cx="130" cy="130" r="108" style={{ strokeDashoffset: 678 - progress * 678 }} />
              </svg>
              <div className="timer-display"><span>{activeMode.eyebrow}</span><strong>{formatTime(remaining)}</strong><small>{statusCopy}</small></div>
            </div>
            <div className="timer-controls">
              <button className="timer-reset" onClick={resetTimer} aria-label="Reset timer"><RotateCcw size={18} /></button>
              <button className="timer-primary" onClick={() => setIsRunning((running) => !running)}>{isRunning ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}<span>{isRunning ? "Pause flight" : remaining === 0 ? "Board again" : "Start flight"}</span></button>
              <button className="timer-sound" onClick={() => setSoundOn((on) => !on)} aria-label={soundOn ? "Mute sound" : "Turn sound on"}><Volume2 size={18} className={!soundOn ? "muted" : ""} /></button>
            </div>
            <div className="timer-footnote"><span><span className={`live-dot ${isRunning ? "on" : ""}`} /> {isRunning ? "timer running" : "timer paused"}</span><span>{autoAdvance ? "auto-advance on" : "manual mode"}</span></div>
          </div>
        </section>

        <section id="method" className="method-section">
          <div className="method-heading"><span className="eyebrow">THE METHOD  /  02</span><h2>Small departures.<br /><em>Longer arrivals.</em></h2></div>
          <div className="method-copy"><p>Pomodoro is simple on purpose: work with one thing for a little while, then step away before your attention gets brittle. FocusFlight adds a sense of place so the ritual has a beginning, a middle, and a landing.</p><div className="method-steps"><div><b>01</b><span>Choose the leg</span><small>Match the route to the time and energy you have.</small></div><div><b>02</b><span>Stay in the air</span><small>Let the clock hold the boundary while you work.</small></div><div><b>03</b><span>Land well</span><small>Take the break. Notice what moved forward.</small></div></div></div>
        </section>

        <section id="about" className="about-section">
          <div className="about-image" aria-hidden="true" />
          <div className="about-copy"><span className="eyebrow">WHY FOCUSFLIGHT  /  03</span><h2>A little atmosphere<br />goes a long <em>way.</em></h2><p>For students, makers, developers, and anyone trying to make room for meaningful work. No account, no noisy dashboard, no pressure to optimize every minute — just a clear next step.</p><div className="about-signature"><span>— The FocusFlight crew</span><span className="signature-line" /></div></div>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><span className="brand-mark"><Compass size={19} strokeWidth={1.8} /></span><span>FocusFlight</span></div><span className="footer-note">A small flight plan for deep work.</span><span className="footer-copy">© 2025 FocusFlight / Made for the work ahead.</span></footer>

      {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><aside className="side-panel" onClick={(event) => event.stopPropagation()}><div className="panel-header"><div><span className="eyebrow">FLIGHT SETTINGS</span><h3>Set your conditions.</h3></div><button className="icon-button" onClick={() => setShowSettings(false)} aria-label="Close settings"><X size={18} /></button></div><div className="panel-field"><span>Soundscape</span><button className={`toggle ${soundOn ? "on" : ""}`} aria-pressed={soundOn} onClick={() => setSoundOn((on) => !on)}><span /></button></div><p className="panel-help">Sound cues are represented visually in this quiet prototype. Your preference is remembered for the session.</p><div className="panel-field"><span>Auto-advance</span><button className={`toggle ${autoAdvance ? "on" : ""}`} aria-pressed={autoAdvance} onClick={() => setAutoAdvance((on) => !on)}><span /></button></div><p className="panel-help">Keep the next break ready when a focus leg lands.</p><div className="panel-divider" /><div className="panel-note"><Bell size={18} /><div><b>Ready for departure</b><span>Pick a route, then press start when the desk is clear.</span></div></div></aside></div>}
      {showHistory && <div className="modal-backdrop" onClick={() => setShowHistory(false)}><aside className="side-panel history-panel" onClick={(event) => event.stopPropagation()}><div className="panel-header"><div><span className="eyebrow">FLIGHT LOG</span><h3>Your recent landings.</h3></div><button className="icon-button" onClick={() => setShowHistory(false)} aria-label="Close history"><X size={18} /></button></div>{history.length === 0 ? <div className="empty-history"><TimerReset size={30} /><b>No flights logged yet.</b><p>Finish a focus leg and it will appear here, with the time you landed.</p></div> : <div className="history-list">{history.map((item, index) => <div className="history-item" key={`${item.finishedAt}-${index}`}><span className="history-index">0{index + 1}</span><div><b>{item.route}</b><span>{item.minutes} min focus leg</span></div><time>{item.finishedAt}</time></div>)}</div>}</aside></div>}
    </div>
  );
}
