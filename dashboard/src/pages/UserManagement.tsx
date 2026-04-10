import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, type UserTier } from "@/contexts/AuthContext";
import { UserPlus, Trash2, Search, Shield, Users, Store, User, Link2, Copy, Check } from "lucide-react";
import { AddUserModal, STORES, TIER_LABELS, CAN_CREATE } from "@/components/AddUserModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: UserTier;
  role: string;
  storeId?: string;
  createdAt: string;
}

// ── Tier badge ────────────────────────────────────────────────────────────────

const TIER_ICONS: Record<UserTier, React.ElementType> = {
  admin: Shield, dm: Users, store_manager: Store, standard: User,
};
const TIER_COLORS: Record<UserTier, string> = {
  admin:         "text-amber-400 bg-amber-400/10 border-amber-400/20",
  dm:            "text-primary bg-primary/10 border-primary/20",
  store_manager: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  standard:      "text-muted-foreground bg-muted/40 border-border/40",
};

function TierBadge({ tier }: { tier: UserTier }) {
  const Icon = TIER_ICONS[tier];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${TIER_COLORS[tier]}`}>
      <Icon className="h-2.5 w-2.5" />
      {TIER_LABELS[tier]}
    </span>
  );
}

// ── Reset link generator (admin / DM only) ────────────────────────────────────

function ResetLinkButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const r = await fetch("/api/auth/admin-reset-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const d = await r.json() as { resetUrl?: string };
      if (d.resetUrl) setResetUrl(d.resetUrl);
    } finally { setLoading(false); }
  }

  function copy() {
    if (!resetUrl) return;
    navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (resetUrl) {
    return (
      <button onClick={copy} title="Copy reset link"
        className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors px-1.5 py-1 rounded hover:bg-amber-400/10">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied!" : "Copy link"}
      </button>
    );
  }
  return (
    <button onClick={generate} disabled={loading} title="Generate reset link"
      className="text-muted-foreground hover:text-amber-400 transition-colors p-1.5 rounded hover:bg-amber-400/10 disabled:opacity-50">
      <Link2 className="h-3.5 w-3.5" />
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UserManagement() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ users: AppUser[] }>({
    queryKey: ["app-users"],
    queryFn: () => fetch("/api/users", { credentials: "include" }).then((r) => r.json()),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/users/${id}`, { method: "DELETE", credentials: "include" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app-users"] }),
  });

  if (!me) return null;

  const users = (data?.users ?? []).filter((u) =>
    search === "" ||
    `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  );

  const storeName = (id?: string) => STORES.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage app access for your team</p>
        </div>
        {CAN_CREATE[me.tier].length > 0 && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        )}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…"
          className="pl-9 pr-3 py-2 w-full text-sm rounded-lg bg-muted/40 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/40" />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Store</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>
              )}
              {users.map((u) => {
                const isSelf = u.id === me.id;
                const canDelete = !isSelf && (CAN_CREATE[me.tier] ?? []).includes(u.tier);
                return (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-muted-foreground text-[13px]">{u.email}</td>
                    <td className="px-4 py-3 text-[13px]">{u.role}</td>
                    <td className="px-4 py-3"><TierBadge tier={u.tier} /></td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {u.tier === "standard" ? storeName(u.storeId) : "All stores"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(me.tier === "admin" || me.tier === "dm") && !isSelf && (
                          <ResetLinkButton userId={u.id} />
                        )}
                        {canDelete && (
                          <button
                            onClick={() => { if (confirm(`Remove ${u.firstName} ${u.lastName}?`)) deleteUser.mutate(u.id); }}
                            className="text-muted-foreground hover:text-rose-400 transition-colors p-1.5 rounded hover:bg-rose-400/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {isSelf && <span className="text-[10px] text-muted-foreground/50">you</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} myTier={me.tier} />}
    </div>
  );
}
