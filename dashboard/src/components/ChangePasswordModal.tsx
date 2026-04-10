import { useState, FormEvent } from "react";
import { X, KeyRound } from "lucide-react";

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (next !== confirm) { setError("New passwords don't match."); return; }
    if (next.length < 6) { setError("New password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await r.json() as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) {
        setError(data.error ?? "Failed to change password.");
      } else {
        setDone(true);
        setTimeout(onClose, 1500);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Change Password</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center space-y-2">
            <p className="text-sm font-medium text-emerald-400">Password updated successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Current Password</label>
              <input
                type="password"
                autoFocus
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                className="mt-1 w-full rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">New Password</label>
              <input
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Confirm New Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="mt-1 w-full rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            {/* Hints */}
            <div className="flex gap-4">
              {[
                { label: "6+ chars", ok: next.length >= 6 },
                { label: "Matches", ok: next.length > 0 && next === confirm },
              ].map(({ label, ok }) => (
                <div key={label} className={`flex items-center gap-1.5 text-[11px] ${ok ? "text-emerald-400" : "text-muted-foreground/50"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                  {label}
                </div>
              ))}
            </div>
            {error && (
              <p className="text-[12px] text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {loading ? "Saving…" : "Update"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
