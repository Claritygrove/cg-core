import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Search, ChevronDown } from "lucide-react";
import type { UserTier } from "@/contexts/AuthContext";

export interface WiwEmployee {
  wiwId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export const STORES = [
  { id: "pc-80237", name: "PC Portage" },
  { id: "se-60039", name: "SE Portage" },
  { id: "pc-80185", name: "PC East Lansing" },
  { id: "pc-80634", name: "PC Jackson" },
  { id: "pc-80726", name: "PC Ann Arbor" },
  { id: "pc-80783", name: "PC Canton" },
  { id: "pc-80877", name: "PC Novi" },
];

export const TIER_LABELS: Record<UserTier, string> = {
  admin:         "Admin",
  dm:            "District Manager",
  store_manager: "Store Manager",
  standard:      "Standard User",
};

export const CAN_CREATE: Record<UserTier, UserTier[]> = {
  admin:         ["admin", "dm", "store_manager", "standard"],
  dm:            ["store_manager", "standard"],
  store_manager: ["standard"],
  standard:      [],
};

export function AddUserModal({
  onClose,
  myTier,
}: {
  onClose: () => void;
  myTier: UserTier;
}) {
  const qc = useQueryClient();
  const allowedTiers = CAN_CREATE[myTier];

  const [step, setStep] = useState<"lookup" | "form">("lookup");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WiwEmployee | null>(null);

  const [email, setEmail]         = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [role, setRole]           = useState("");
  const [tier, setTier]           = useState<UserTier>(allowedTiers[0] ?? "standard");
  const [storeId, setStoreId]     = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");

  const { data: wiwData, isLoading: wiwLoading } = useQuery<{ employees: WiwEmployee[]; error?: string }>({
    queryKey: ["wiw-employees"],
    queryFn: () => fetch("/api/wiw/employees", { credentials: "include" }).then((r) => r.json()),
  });

  const filtered = (wiwData?.employees ?? []).filter(
    (e) => search === "" || `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const createUser = useMutation({
    mutationFn: (body: object) =>
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed");
        return r.json();
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["app-users"] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  function selectEmployee(emp: WiwEmployee) {
    setSelected(emp);
    setEmail(emp.email);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setRole(emp.role);
    setStep("form");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    createUser.mutate({ email, password, firstName, lastName, tier, role, storeId: storeId || undefined, wiwId: selected?.wiwId });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold text-sm">
            {step === "lookup" ? "Find Employee in When I Work" : "Set Up Account"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {/* Step 1: WIW lookup */}
        {step === "lookup" && (
          <div className="p-5 space-y-4">
            {wiwData?.error ? (
              <div className="space-y-3">
                <p className="text-[12px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                  {wiwData.error}
                </p>
                <p className="text-[11px] text-muted-foreground">You can still add a user manually.</p>
                <button onClick={() => setStep("form")} className="w-full py-2 rounded-lg bg-muted/50 border border-border/50 text-sm hover:bg-muted transition-colors">
                  Add manually
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-muted/40 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/40" />
                </div>
                {wiwLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading employees…</p>
                ) : (
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No employees found</p>}
                    {filtered.map((emp) => (
                      <button key={emp.wiwId} onClick={() => selectEmployee(emp)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors">
                        <p className="text-[13px] font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[11px] text-muted-foreground">{emp.email} · {emp.role}</p>
                      </button>
                    ))}
                  </div>
                )}
                <div className="border-t border-border/30 pt-3">
                  <button onClick={() => setStep("form")} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    Skip — add user manually
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Form */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {selected && (
              <p className="text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                Pre-filled from WIW: {selected.firstName} {selected.lastName}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">First Name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                  className="mt-1 w-full rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Last Name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} required
                  className="mt-1 w-full rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Current Role / Title</label>
              <input value={role} onChange={(e) => setRole(e.target.value)} required placeholder="e.g. Store Manager, Keyholder"
                className="mt-1 w-full rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">App Tier</label>
              <div className="relative mt-1">
                <select value={tier} onChange={(e) => setTier(e.target.value as UserTier)}
                  className="appearance-none w-full rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 pr-8">
                  {allowedTiers.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            {tier === "standard" && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Store</label>
                <div className="relative mt-1">
                  <select value={storeId} onChange={(e) => setStoreId(e.target.value)} required={tier === "standard"}
                    className="appearance-none w-full rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 pr-8">
                    <option value="">Select store…</option>
                    {STORES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Temporary Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                placeholder="Min. 6 characters"
                className="mt-1 w-full rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
            {error && <p className="text-[12px] text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setStep("lookup")}
                className="flex-1 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                Back
              </button>
              <button type="submit" disabled={createUser.isPending}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {createUser.isPending ? "Creating…" : "Create User"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
