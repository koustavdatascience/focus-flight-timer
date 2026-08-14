import type { PropsWithChildren, ReactNode } from "react";
import { ArrowLeft, Plane } from "lucide-react";
import { useLocation } from "wouter";
import "../public-pages.css";

type PublicPageLayoutProps = PropsWithChildren<{
  eyebrow: string;
  title: ReactNode;
  intro: string;
  className?: string;
}>;

const footerLinks = [
  ["About", "/about"],
  ["Changelog", "/changelog"],
  ["Feedback", "/feedback"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
] as const;

export function PublicPageLayout({ eyebrow, title, intro, className = "", children }: PublicPageLayoutProps) {
  const [, navigate] = useLocation();
  return (
    <main className={`public-page ${className}`}>
      <header className="public-page-header">
        <button className="public-wordmark" onClick={() => navigate("/")}>FocusFlight</button>
        <nav aria-label="Public page navigation" className="public-page-nav">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/leaderboards")}>Rankings</button>
          <button onClick={() => navigate("/")}><ArrowLeft size={14} /> Timer</button>
        </nav>
      </header>
      <section className="public-page-hero">
        <span className="public-eyebrow"><Plane size={14} fill="currentColor" /> {eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      <div className="public-page-content">{children}</div>
      <footer className="public-page-footer">
        <span>FocusFlight · a virtual focus journey</span>
        <nav aria-label="Footer navigation">{footerLinks.map(([label, path]) => <button key={path} onClick={() => navigate(path)}>{label}</button>)}</nav>
      </footer>
    </main>
  );
}
