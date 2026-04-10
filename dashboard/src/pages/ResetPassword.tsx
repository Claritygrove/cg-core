import { useState, useEffect, FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [validating, setValidating] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<{ valid: boolean; email?: string; firstName?: string; error?: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setTokenInfo({ valid: false, error: "No reset token found in the link." });
      setValidating(false);
      return;
    }
    fetch(`/api/auth/validate-reset-token/${token}`)
      .then((r) => r.json())
      .then((d) => setTokenInfo(d))
      .catch(() => setTokenInfo({ valid: false, error: "Could not validate the link." }))
      .finally(() => setValidating(false));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await r.json() as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) {
        setError(data.error ?? "Reset failed. The link may have expired.");
      } else {
        setDone(true);
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
        </div>

        {validating && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {!validating && tokenInfo && !tokenInfo.valid && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-4">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-400">Link invalid or expired</p>
                <p className="text-[12px] text-rose-400/80 mt-0.5">{tokenInfo.error}</p>
              </div>
            </div>
            <Link
              href="/forgot-password"
              className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Request a new link
            </Link>
          </div>
        )}

        {!validating && tokenInfo?.valid && !done && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {tokenInfo.firstName && (
              <p className="text-sm text-muted-foreground text-center">
                Hi <span className="font-medium text-foreground">{tokenInfo.firstName}</span> — choose a new password for <span className="font-medium text-foreground">{tokenInfo.email}</span>.
              </p>
            )}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                New Password
              </label>
              <input
                type="password"
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl bg-muted/40 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full rounded-xl bg-muted/40 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                placeholder="Same as above"
              />
            </div>
            {/* Password strength hints */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "6+ characters", ok: newPassword.length >= 6 },
                { label: "Passwords match", ok: newPassword.length > 0 && newPassword === confirm },
              ].map(({ label, ok }) => (
                <div key={label} className={`flex items-center gap-1.5 text-[11px] ${ok ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                  {label}
                </div>
              ))}
            </div>
            {error && (
              <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Saving…" : "Set New Password"}
            </button>
          </form>
        )}

        {done && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Password updated!</p>
                <p className="text-[12px] text-emerald-400/80 mt-0.5">Redirecting you to sign in…</p>
              </div>
            </div>
          </div>
        )}

        {!done && (
          <div className="flex justify-center">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
