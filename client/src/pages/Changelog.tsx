import { CheckCircle2, CircleDotDashed, Compass } from "lucide-react";
import { PublicPageLayout } from "./PublicPageLayout";

const shipped = [
  ["14 August 2026", "A clearer public field guide", "Published the About, legal-draft, feedback, changelog, guide, crawl-control, and accessibility updates that explain FocusFlight in plain language."],
  ["14 August 2026", "Co-Focus, profiles, and rankings", "Added persistent rooms with synchronized group-flight rules, separate group history, optional solo-location sync offers, privacy-aware public profiles, friendship and block controls, and separate Solo and Co-Focus focus-time rankings."],
  ["13 August 2026", "Account and privacy foundations", "Added password recovery, a Google sign-in entry point, profile identity, privacy settings, public profile routing, and Supabase-backed security foundations."],
  ["13 August 2026", "The first FocusFlight release", "Introduced the interactive flight timer, airport and city search, geographic routes, flight-duration framing, account support, and a personal solo journey history."],
] as const;

export default function Changelog() {
  return (
    <PublicPageLayout eyebrow="Development log" title={<>The flight log, <em>kept honest.</em></>} intro="A short record of real FocusFlight releases. Planned ideas stay separate from what has already shipped.">
      <section className="public-panel changelog-intro"><Compass size={20} aria-hidden="true" /><p>Entries describe changes that are in the product today. FocusFlight does not publish speculative release dates or feature promises here.</p></section>
      <section className="public-section"><div className="section-heading"><span className="panel-label">Shipped</span><h2>Recent routes on the map.</h2></div><ol className="changelog-list">{shipped.map(([date, title, copy]) => <li key={title}><CheckCircle2 size={19} aria-hidden="true" /><div><time>{date}</time><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></section>
      <section className="public-section public-section-tinted"><div className="section-heading"><span className="panel-label">In development</span><h2>What keeps improving.</h2></div><div className="public-panel changelog-current"><CircleDotDashed size={20} aria-hidden="true" /><div><h3>Reliability, clarity, and careful launch preparation.</h3><p>FocusFlight continues to improve its accessibility, validation, and operational readiness. This is a development note, not a promise of a particular release date.</p></div></div></section>
    </PublicPageLayout>
  );
}
