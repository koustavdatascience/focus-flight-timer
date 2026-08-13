import { ArrowLeft, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export type AuthDialogMode = "signin" | "signup" | "reset" | "update-password";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthDialogMode;
};

export function AuthDialog({ open, onOpenChange, initialMode = "signin" }: AuthDialogProps) {
  const { signIn, signInWithProvider, signUp, resetPassword, updatePassword } = useSupabaseAuth();
  const [mode, setMode] = useState<AuthDialogMode>(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setMessage("");
    setPassword("");
    setPasswordConfirmation("");
  }, [initialMode, open]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      if (mode === "signin") {
        await signIn({ email: email.trim(), password });
        onOpenChange(false);
      } else if (mode === "signup") {
        const result = await signUp({ email: email.trim(), password, displayName });
        setMessage(result.confirmationRequired ? "Check your inbox to confirm your account, then return here to sign in." : "Account created — your flight log is ready.");
        if (!result.confirmationRequired) onOpenChange(false);
      } else if (mode === "reset") {
        await resetPassword(email.trim());
        setMessage("If an account exists for this address, a secure reset link is now on its way.");
      } else {
        if (password !== passwordConfirmation) throw new Error("The new passwords do not match.");
        await updatePassword(password);
        setMessage("Your password has been updated. You can continue your journey.");
        window.setTimeout(() => onOpenChange(false), 700);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not complete that request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode: AuthDialogMode) {
    setMode(nextMode);
    setMessage("");
    setPassword("");
    setPasswordConfirmation("");
  }

  async function handleGoogleSignIn() {
    setSubmitting(true);
    setMessage("");
    try {
      await signInWithProvider("google");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google sign-in could not be started. Please try again.");
      setSubmitting(false);
    }
  }

  const isCredentialMode = mode === "signin" || mode === "signup";
  const isPasswordUpdate = mode === "update-password";
  const title = mode === "signin" ? "Return to your journey." : mode === "signup" ? "Keep every journey." : isPasswordUpdate ? "Choose a new password." : "Recover your account.";
  const description = mode === "signin" ? "Sign in to resume a saved focus flight or visit your personal map." : mode === "signup" ? "Create a private account to save every completed focus flight." : isPasswordUpdate ? "Set a fresh password for your FocusFlight account." : "Enter your email and we will send a secure password-reset link if an account exists.";

  return (
    <div className="auth-dialog-backdrop" role="presentation" onMouseDown={() => onOpenChange(false)}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="auth-dialog-close" type="button" onClick={() => onOpenChange(false)} aria-label="Close account dialog"><X size={18} /></button>
        <span className="selection-eyebrow">FocusFlight account</span>
        <h2 id="auth-dialog-title">{title}</h2>
        <p>{description}</p>
        {isCredentialMode ? <div className="auth-dialog-tabs" role="tablist" aria-label="Account actions">
          <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "active" : ""} onClick={() => changeMode("signin")}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => changeMode("signup")}>Create account</button>
        </div> : <button className="auth-dialog-back-link" type="button" onClick={() => changeMode("signin")}><ArrowLeft size={14} /> Back to sign in</button>}
        <form className="auth-dialog-form" onSubmit={handleSubmit}>
          {mode === "signup" && <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" placeholder="How should we address you?" /></label>}
          {!isPasswordUpdate && <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></label>}
          {mode !== "reset" && <label>{isPasswordUpdate ? "New password" : "Password"}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} placeholder="At least 6 characters" required /></label>}
          {isPasswordUpdate && <label>Confirm new password<input type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" minLength={6} placeholder="Repeat your new password" required /></label>}
          {message && <div className="auth-dialog-message" role="status">{message}</div>}
          <button className="start-flight-button" type="submit" disabled={submitting}>{submitting ? "Working…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Update password"}</button>
        </form>
        {isCredentialMode && <>
          <div className="auth-dialog-divider"><span>or</span></div>
          <button className="auth-google-button" type="button" onClick={() => void handleGoogleSignIn()} disabled={submitting}><span aria-hidden="true">G</span>Continue with Google</button>
        </>}
        {mode === "signin" && <button className="auth-dialog-link" type="button" onClick={() => changeMode("reset")}>Forgot your password?</button>}
      </section>
    </div>
  );
}
