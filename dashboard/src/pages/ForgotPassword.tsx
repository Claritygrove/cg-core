import { useState, FormEvent } from "react";
import { Link } from "wouter";
import { ArrowLeft, Mail, Copy, Check } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: boolean; message: string; resetUrl?: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json() as { sent: boolean; message: string; resetUrl?: string };
      setResult(data);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!result?.resetUrl) return;
    navigator.clipboard.writeText(result.resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 mb-2">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl bg-muted/40 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                placeholder="you@eaglevco.com"
              />
            </div>

            {error && (
              <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-xl border px-4 py-4 space-y-2 ${
              result.sent
                ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                : "bg-amber-400/10 border-amber-400/20 text-amber-400"
            }`}>
              <p className="text-sm font-medium">{result.message}</p>
              {result.sent && (
                <p className="text-[12px] opacity-80">Check your inbox. The link expires in 1 hour.</p>
              )}
            </div>

            {/* If email not configured, show the link for admin to copy */}
            {!result.sent && result.resetUrl && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Copy this link and send it to the user directly:
                </p>
                <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-lg px-3 py-2">
                  <code className="text-[11px] flex-1 break-all text-muted-foreground">{result.resetUrl}</code>
                  <button
                    onClick={copyLink}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/60">
                  To enable email delivery, add SMTP settings to your .env file.
                </p>
              </div>
            )}

            <button
              onClick={() => { setResult(null); setEmail(""); }}
              className="w-full rounded-xl border border-border/50 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              Try another email
            </button>
          </div>
        )}

        <div className="flex justify-center">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
