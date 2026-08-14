import { FormEvent, useState } from "react";
import { CheckCircle2, LockKeyhole, Send } from "lucide-react";
import { useLocation } from "wouter";
import { AuthDialog, type AuthDialogMode } from "@/components/auth/AuthDialog";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { feedbackCategories, submitFocusflightFeedback, type FeedbackCategory, validateFeedbackMessage } from "@/services/feedback";
import { PublicPageLayout } from "./PublicPageLayout";

const labels: Record<FeedbackCategory, string> = { bug: "Bug report", idea: "Feature idea", map_route: "Map or route issue", account: "Account issue", other: "Something else" };

export default function Feedback() {
  const { isAuthenticated } = useSupabaseAuth();
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<AuthDialogMode>("signin");
  const [location] = useLocation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = validateFeedbackMessage(message);
    if (validation) { setError(validation); return; }
    setError(""); setState("sending");
    try { await submitFocusflightFeedback(category, message, location.split("?")[0]); setState("sent"); setMessage(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Feedback could not be sent right now. Please try again shortly."); setState("idle"); }
  }

  return <PublicPageLayout className="feedback-page" eyebrow="Pilot notes" title={<>Help shape the next <em>flight.</em></>} intro="Found a bug, had trouble with a route, or have an idea that would make focusing easier? Specific notes are especially useful.">
    <section className="feedback-layout">
      <aside className="public-panel feedback-aside"><LockKeyhole size={20} /><h2>Private by default.</h2><p>Feedback is available to signed-in pilots and is stored privately for project improvement. Please do not include passwords, payment details, or sensitive personal information.</p><p>A reply is not guaranteed.</p></aside>
      <section className="public-panel feedback-form-panel">{state === "sent" ? <div className="feedback-success"><CheckCircle2 size={30} /><h2>Note received.</h2><p>Thank you for helping improve FocusFlight. You can send another note after a short pause.</p><button className="public-text-button" onClick={() => setState("idle")}>Send another note</button></div> : !isAuthenticated ? <div className="feedback-signin"><LockKeyhole size={26} /><h2>Sign in to send a note.</h2><p>This keeps feedback private and gives the project a small amount of abuse protection.</p><button className="public-primary-button" onClick={() => { setDialogMode("signin"); setDialogOpen(true); }}>Sign in to continue</button></div> : <form onSubmit={submit}><label>Category<select value={category} onChange={(event) => setCategory(event.target.value as FeedbackCategory)}>{feedbackCategories.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label><label>What happened, or what would help?<textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={5000} placeholder="A short, specific note is most helpful." required /></label><div className="feedback-form-meta"><span>{message.trim().length}/5000</span><span>Sent from {location.split("?")[0] || "/"}</span></div>{error && <p className="feedback-error" role="alert">{error}</p>}<button className="public-primary-button" disabled={state === "sending"}>{state === "sending" ? "Sending…" : <>Send feedback <Send size={16} /></>}</button></form>}</section>
    </section><AuthDialog open={dialogOpen} initialMode={dialogMode} onOpenChange={setDialogOpen} />
  </PublicPageLayout>;
}
