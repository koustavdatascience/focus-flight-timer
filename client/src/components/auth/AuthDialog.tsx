import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { signIn, signUp } = useSupabaseAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      if (mode === "signin") {
        await signIn({ email: email.trim(), password });
        onOpenChange(false);
      } else {
        const result = await signUp({ email: email.trim(), password, displayName });
        setMessage(result.confirmationRequired ? "Check your inbox to confirm your account, then return here to sign in." : "Account created — your flight log is ready.");
        if (!result.confirmationRequired) onOpenChange(false);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not complete that request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <div className="auth-dialog-backdrop" role="presentation" onMouseDown={() => onOpenChange(false)}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="auth-dialog-close" type="button" onClick={() => onOpenChange(false)} aria-label="Close account dialog"><X size={18} /></button>
        <span className="selection-eyebrow">FocusFlight account</span>
        <h2 id="auth-dialog-title">{mode === "signin" ? "Return to your journey." : "Keep every journey."}</h2>
        <p>{mode === "signin" ? "Sign in to resume a saved focus flight or visit your personal map." : "Create a private account to save every completed focus flight."}</p>
        <div className="auth-dialog-tabs" role="tablist" aria-label="Account actions">
          <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "active" : ""} onClick={() => changeMode("signin")}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => changeMode("signup")}>Create account</button>
        </div>
        <form className="auth-dialog-form" onSubmit={handleSubmit}>
          {mode === "signup" && <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" placeholder="How should we address you?" /></label>}
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} placeholder="At least 6 characters" required /></label>
          {message && <div className="auth-dialog-message" role="status">{message}</div>}
          <button className="start-flight-button" type="submit" disabled={submitting}>{submitting ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
      </section>
    </div>
  );
}
