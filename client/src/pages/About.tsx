import { ArrowRight, Compass, MapPinned, Plane, Route, ShieldCheck, TimerReset, UsersRound } from "lucide-react";
import { useLocation } from "wouter";
import { PublicPageLayout } from "./PublicPageLayout";

const steps = [
  ["01", "Choose your route", "Search for a starting airport and a destination. Waypoint uses those selected locations to place a virtual route on a real, interactive map."],
  ["02", "Begin your flight", "Start the focus timer. The planned path and aircraft progress are tied to the same clock, so the visible journey moves with your session."],
  ["03", "Keep your focus", "Pause when life interrupts, then resume the same flight later. The route stays visible while you work, rather than resetting your progress."],
  ["04", "Arrive and remember", "Finish a solo flight to add it to your personal journey. An unfinished flight never changes your virtual solo location."],
] as const;

const features = [
  [MapPinned, "A map you can explore", "Pan, zoom, and follow airport-to-airport routes on an interactive OpenStreetMap-based map."],
  [Route, "Searchable airport routes", "Select origins and destinations by airport code, airport name, or city, then see the geographic route."],
  [TimerReset, "Focus-linked progress", "The route, aircraft, and countdown share one focus session, with pause and resume when life gets in the way."],
  [Compass, "Personal journey", "Signed-in pilots can keep a private record of completed solo flights, visited places, and focus patterns."],
  [UsersRound, "Co-Focus and rankings", "Fly in persistent rooms, keep group history separate from solo travel, and opt into completed-focus-time rankings."],
] as const;

const foundations = [
  ["Leaflet + OpenStreetMap", "A moveable, zoomable map instead of a decorative background."],
  ["Geographic route calculations", "The aircraft follows the same route shown on screen, including long-distance paths."],
  ["Supabase accounts and data", "Accounts and completed trip records are associated with the signed-in user and protected by data policies."],
  ["Responsive web delivery", "The focus experience is designed to work in a modern browser on desktop or mobile."],
] as const;

export default function About() {
  const [, navigate] = useLocation();

  return (
    <PublicPageLayout
      eyebrow="The field guide"
      title={<>Focus a little <em>farther.</em></>}
      intro="Waypoint is a virtual flight timer for study, work, and deliberate time. Choose an origin and destination, begin a focus session, and watch a real route move forward as your timer counts down."
    >
      <section className="about-intro-grid">
        <article className="public-panel public-prose">
          <span className="panel-label">The idea</span>
          <h2>A focused block of time can have a beginning, middle, and arrival.</h2>
          <p>Waypoint is not a booking tool and it does not track your physical location. Airports, routes, and current locations are virtual parts of the focus experience: a small way to make a deliberate block of time feel like a journey.</p>
          <div className="about-hero-actions">
            <button className="public-primary-button" onClick={() => navigate("/")}>Start a focus flight <ArrowRight size={16} /></button>
            <a className="public-text-button" href="#how-it-works">See how it works <ArrowRight size={15} /></a>
          </div>
        </article>
        <aside className="about-route-card" aria-label="Illustration of a virtual focus route">
          <span className="panel-label">A virtual flight, not real travel</span>
          <div className="about-route-line"><span>Origin</span><i /><Plane size={23} fill="currentColor" aria-hidden="true" /><i /><span>Arrival</span></div>
          <p>Real map coordinates. A timer-led journey. Your own pace.</p>
        </aside>
      </section>

      <section id="how-it-works" className="public-section" aria-labelledby="how-it-works-title">
        <div className="section-heading"><span className="panel-label">How Waypoint works</span><h2 id="how-it-works-title">Four calm steps, one shared clock.</h2></div>
        <ol className="about-steps">{steps.map(([number, title, copy]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
      </section>

      <section className="public-section public-section-tinted" aria-labelledby="today-title">
        <div className="section-heading"><span className="panel-label">What you can do today</span><h2 id="today-title">Built for the way attention actually moves.</h2></div>
        <div className="feature-grid feature-grid-wide">{features.map(([Icon, title, copy]) => <article key={title} className="feature-card"><Icon size={20} aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="public-section about-transparency" aria-labelledby="made-with-title">
        <div className="section-heading"><span className="panel-label">Made with maps, routes, and a little focus</span><h2 id="made-with-title">Technical choices, explained for people.</h2></div>
        <p className="about-transparency-intro">Waypoint uses an interactive map rather than a decorative background. Airports use real coordinates, routes are geographic, and the timer controls the visible journey. The technical details are kept purposeful so the experience can stay small and understandable.</p>
        <dl className="about-transparency-grid">{foundations.map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl>
      </section>

      <section className="about-note-grid">
        <article className="public-panel public-prose">
          <span className="panel-label">Built while learning</span>
          <h2>An independent project, growing carefully.</h2>
          <p>I built Waypoint because I was tired of timers that just sit there counting down at you. I wanted it to feel like actually going somewhere, so it turned into a map, then a route, then kind of a log of my own flights.</p>
          <p>I&apos;m still figuring it out as I go, and I&apos;m keeping it small on purpose.</p>
          <p>If something&apos;s confusing, or breaks, or you try it and think it&apos;s onto something tell me. Doesn&apos;t need to be long, just specific. I read every note. Can&apos;t promise I&apos;ll write back to all of them, but I&apos;m paying attention.</p>
          <button className="public-text-button" onClick={() => navigate("/feedback")}>Send feedback <ArrowRight size={15} /></button>
        </article>
        <article className="about-tech-card">
          <span className="panel-label">Development log</span>
          <h3>Small, factual entries rather than a promise-filled roadmap.</h3>
          <p>The flight log records real milestones: the interactive focus timer and personal journey, followed by account recovery, privacy controls, Co-Focus rooms, group history, profiles, rankings, and the public information pages.</p>
          <button className="public-text-button" onClick={() => navigate("/changelog")}>Read the flight log <ArrowRight size={15} /></button>
        </article>
      </section>
    </PublicPageLayout>
  );
}
