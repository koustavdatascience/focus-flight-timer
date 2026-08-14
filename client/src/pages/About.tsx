import { ArrowRight, Compass, MapPinned, Plane, Route, TimerReset, UsersRound } from "lucide-react";
import { useLocation } from "wouter";
import { PublicPageLayout } from "./PublicPageLayout";

const steps = [
  ["01", "Choose your route", "Search for a starting airport and a destination. FocusFlight places the virtual route on a real interactive map."],
  ["02", "Begin the flight", "Start a focus timer. The route and aircraft progress use the same clock, so the journey moves with your session."],
  ["03", "Keep your focus", "If life interrupts, pause and resume the same flight later. The route remains visible while you work."],
  ["04", "Arrive and remember", "Complete a solo flight to add it to your personal journey. Unfinished flights never move your virtual solo location."],
] as const;

const features = [
  [MapPinned, "A map you can actually explore", "Choose airports, pan and zoom the map, and follow a geographic route rather than a decorative background."],
  [Route, "Routes tied to focus", "The aircraft, visible route progress, and countdown are connected to the same focus session."],
  [Compass, "A private pilot log", "Signed-in pilots can keep completed solo trips, current virtual location, profile controls, and personal insights."],
  [UsersRound, "Co-Focus flights", "Create a persistent room, choose a shared route, and progress only while every current member is present."],
  [TimerReset, "Separate ways to fly", "Solo and Co-Focus records stay separate. Rankings use completed focus time, never distance."],
] as const;

export default function About() {
  const [, navigate] = useLocation();
  return (
    <PublicPageLayout eyebrow="The field guide" title={<>Focus a little <em>farther.</em></>} intro="FocusFlight is a virtual flight timer for study, work, and deliberate time. Choose a route, begin a focus session, and watch the map carry the journey forward.">
      <section className="about-intro-grid">
        <div className="public-panel public-prose">
          <span className="panel-label">The idea</span>
          <h2>A focused block of time can have a beginning, middle, and arrival.</h2>
          <p>FocusFlight turns a timer into a small virtual journey. It is not a booking tool and it does not track your physical location. Airports, routes, and current locations are part of the focus experience.</p>
          <button className="public-primary-button" onClick={() => navigate("/")}>Start a focus flight <ArrowRight size={16} /></button>
        </div>
        <div className="about-route-card" aria-label="Illustration of a virtual focus route">
          <span className="panel-label">A virtual flight, not real travel</span>
          <div className="about-route-line"><span>Origin</span><i /><Plane size={23} fill="currentColor" /><i /><span>Arrival</span></div>
          <p>Real map coordinates. A timer-led journey. Your own pace.</p>
        </div>
      </section>

      <section className="public-section">
        <div className="section-heading"><span className="panel-label">How it works</span><h2>Four calm steps, one shared clock.</h2></div>
        <ol className="about-steps">{steps.map(([number, title, copy]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
      </section>

      <section className="public-section public-section-tinted">
        <div className="section-heading"><span className="panel-label">What you can do today</span><h2>Built for the way attention actually moves.</h2></div>
        <div className="feature-grid">{features.map(([Icon, title, copy]) => <article key={title} className="feature-card"><Icon size={20} /><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="about-note-grid">
        <article className="public-panel public-prose"><span className="panel-label">Built while learning</span><h2>An independent project, growing in public.</h2><p>FocusFlight began as a way to make a timer feel less like a countdown in the corner of a screen. It became a map, then a route, then a personal flight log. The project is still being refined with care and kept intentionally simple.</p><p>If something is confusing, broken, or worth trying, a short, specific note is genuinely useful.</p><button className="public-text-button" onClick={() => navigate("/feedback")}>Send feedback <ArrowRight size={15} /></button></article>
        <article className="about-tech-card"><span className="panel-label">Made with maps and routes</span><h3>Real map interaction, geographic flight paths, and authenticated personal data.</h3><p>FocusFlight uses an interactive OpenStreetMap-based map, geographic route calculations, Supabase for accounts and data, and a responsive web delivery layer.</p><button className="public-text-button" onClick={() => navigate("/changelog")}>Read the flight log <ArrowRight size={15} /></button></article>
      </section>
    </PublicPageLayout>
  );
}
