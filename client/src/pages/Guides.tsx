import { Link, useLocation } from "wouter";
import { ArrowRight, CheckCircle2, CircleHelp, Compass, Plane } from "lucide-react";
import { PublicPageLayout } from "./PublicPageLayout";
import { focusGuides, guideForSlug } from "@/services/seo";

function GuideIndex() {
  return (
    <PublicPageLayout eyebrow="Focus guides" title={<>Make <em>attention</em> easier to begin.</>} intro="Practical, original field notes for calmer Pomodoro sessions, better study planning, and using FocusFlight’s journey metaphor with intention.">
      <section className="guide-grid" aria-label="FocusFlight guides">
        {focusGuides.map((guide) => (
          <article className="guide-card" key={guide.slug}>
            <span className="panel-label"><Compass size={14} /> {guide.eyebrow}</span>
            <h2>{guide.title}</h2>
            <p>{guide.description}</p>
            <Link className="public-text-button" href={`/guides/${guide.slug}`}>Read guide <ArrowRight size={15} /></Link>
          </article>
        ))}
      </section>
    </PublicPageLayout>
  );
}

export default function Guides() {
  const [location] = useLocation();
  const slug = location.split("/").filter(Boolean).at(-1);
  const guide = guideForSlug(slug);
  if (!guide) return <GuideIndex />;

  return (
    <PublicPageLayout eyebrow={guide.eyebrow} title={guide.title} intro={guide.intro} className="guide-page">
      <article className="guide-article">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
        <section className="guide-callout">
          <Plane size={19} aria-hidden="true" />
          <div><strong>Ready for a calmer session?</strong><p>Choose a route, define one useful outcome, and let the timer hold the boundary.</p></div>
          <Link href="/" className="public-primary-button">Open the timer <ArrowRight size={15} /></Link>
        </section>
        <section className="guide-faq" aria-labelledby="guide-faq-heading">
          <span className="panel-label"><CircleHelp size={14} /> Frequently asked questions</span>
          <h2 id="guide-faq-heading">A few useful answers</h2>
          {guide.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
        </section>
      </article>
      <aside className="guide-next-steps" aria-label="More FocusFlight guides">
        <CheckCircle2 size={18} />
        <div><strong>Continue the field notes</strong><p>Explore another guide or return to FocusFlight when you are ready to begin.</p></div>
        <Link href="/guides" className="public-text-button">All guides <ArrowRight size={15} /></Link>
      </aside>
    </PublicPageLayout>
  );
}
