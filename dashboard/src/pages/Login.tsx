import { useState, FormEvent } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 mb-2">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-primary fill-current">
              <path d="M12 2C8.5 2 5.5 4.5 5.5 8c0 2.4 1.3 4.5 3.2 5.7L7 21h10l-1.7-7.3C17.2 12.5 18.5 10.4 18.5 8c0-3.5-3-6-6.5-6z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">The Core</h1>
          <p className="text-sm text-muted-foreground">Eagle V Corporation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-muted/40 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              placeholder="you@eaglevco.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl bg-muted/40 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              placeholder="••••••••"
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
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <div className="flex justify-center">
            <Link
              href="/forgot-password"
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </form>

        <p className="text-center text-[11px] text-muted-foreground/60">
          Contact your admin if you need access
        </p>
      </div>
    </div>
  );
}
