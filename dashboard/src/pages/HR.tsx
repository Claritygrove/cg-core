import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, X, ArrowLeft, Download, FileText, Plus, Check, UserPlus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import type { UserTier } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AddUserModal, CAN_CREATE, STORES as APP_STORES, TIER_LABELS } from "@/components/AddUserModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmployeeType =
  | "Sales Associate"
  | "Buyer"
  | "Shift Lead"
  | "MOD"
  | "Senior Trainer"
  | "Assistant Manager"
  | "Store Manager";

interface Employee {
  id: string;
  fullName: string;
  employeeType: EmployeeType;
  store: string;
  startDate: string;
  checklist: Record<string, boolean>;
}

// ─── Training checklists per role ─────────────────────────────────────────────

const ROLE_CHECKLISTS: Record<EmployeeType, string[]> = {
  "Sales Associate": [
    "Complete new hire paperwork",
    "Store tour & safety walkthrough",
    "POS system training",
    "Fitting room & floor procedures",
    "Customer service expectations",
    "Loss prevention basics",
    "Buy counter observation (1 session)",
    "Clothing grading standards — intro",
    "Opening / closing procedures",
    "Complete solo floor shift",
  ],
  "Buyer": [
    "Complete Sales Associate track",
    "Buy counter fundamentals",
    "Brand identification — apparel",
    "Pricing guidelines review",
    "Rejection & acceptance standards",
    "Shoes & accessories grading",
    "Outerwear & specialty items",
    "Electronics grading (if applicable)",
    "10 supervised buys completed",
    "Pass grading assessment",
    "Independent buy sign-off",
    "Backroom organization standards",
  ],
  "Shift Lead": [
    "Complete Sales Associate track",
    "Cash handling & drawer counts",
    "Opening lead procedures",
    "Closing lead procedures",
    "Staff break scheduling",
    "Customer escalation handling",
    "Deposit & safe procedures",
    "EOD reporting",
    "Staff communication basics",
    "Emergency procedures review",
  ],
  "MOD": [
    "Complete Shift Lead track",
    "MOD certification complete",
    "Alarm & security procedures",
    "Vendor check-in process",
    "Loss prevention response protocol",
    "Staff coaching basics",
    "Incident documentation",
    "Scheduling assistance (WIW intro)",
    "Injury / accident reporting",
    "In-store conflict resolution",
    "Daily operations checklist sign-off",
  ],
  "Senior Trainer": [
    "Complete Buyer track",
    "Training curriculum review",
    "Shadow new hire (3 sessions)",
    "Lead training session independently",
    "Onboarding packet prep",
    "Grading assessment administration",
    "Training feedback & documentation",
    "Trainer certification complete",
    "New trainer shadow (1 session)",
    "Evaluation process certified",
  ],
  "Assistant Manager": [
    "Complete MOD track",
    "WIW scheduling — full access",
    "Performance review process",
    "Hiring process overview",
    "Winmark portal — AM access",
    "Inventory & receiving procedures",
    "Store financial basics",
    "Banking & cash office procedures",
    "HR handbook review",
    "Corrective action documentation",
    "Shrink & LP reporting",
    "District Manager communication protocol",
  ],
  "Store Manager": [
    "Complete Assistant Manager track",
    "Full Winmark portal certification",
    "P&L review training",
    "Annual review process",
    "QBO / reporting basics",
    "District Manager meeting protocol",
    "Store budget overview",
    "Vendor relationships overview",
    "Full HR handbook sign-off",
    "Compliance & legal overview (MI)",
    "Emergency management protocol",
    "Store Manager certification complete",
  ],
};

// PDF documents available per role
const ROLE_PDFS: Record<EmployeeType, string[]> = {
  "Sales Associate":   ["New Hire Handbook", "POS Quick Reference", "Loss Prevention Guide"],
  "Buyer":             ["Buyer Certification Guide", "Brand ID Reference Sheet", "Grading Standards Manual"],
  "Shift Lead":        ["Shift Lead Handbook", "Cash Handling Procedures", "EOD Checklist"],
  "MOD":               ["MOD Certification Packet", "Incident Report Template", "LP Response Protocol"],
  "Senior Trainer":    ["Trainer Certification Guide", "Onboarding Packet Template", "Grading Assessment Form"],
  "Assistant Manager": ["AM Handbook", "WIW Scheduling Guide", "Corrective Action Forms"],
  "Store Manager":     ["SM Handbook", "P&L Overview", "Annual Review Template", "Compliance Checklist (MI)"],
};

// ─── Sample data with pre-seeded checklist progress ──────────────────────────

function seedChecklist(type: EmployeeType, completedCount: number): Record<string, boolean> {
  const items = ROLE_CHECKLISTS[type];
  const result: Record<string, boolean> = {};
  items.forEach((item, i) => {
    result[item] = i < completedCount;
  });
  return result;
}

const INITIAL_EMPLOYEES: Employee[] = [
  { id: "1",  fullName: "Jordan Alvarez",   employeeType: "Sales Associate",   store: "PC Portage",      startDate: "2026-02-24", checklist: seedChecklist("Sales Associate",   6) },
  { id: "2",  fullName: "Makayla Chen",     employeeType: "Buyer",             store: "PC East Lansing", startDate: "2026-02-17", checklist: seedChecklist("Buyer",             9) },
  { id: "3",  fullName: "Tyler Benson",     employeeType: "Sales Associate",   store: "PC Ann Arbor",    startDate: "2026-03-03", checklist: seedChecklist("Sales Associate",   3) },
  { id: "4",  fullName: "Destiny Williams", employeeType: "Shift Lead",        store: "PC Canton",       startDate: "2026-01-13", checklist: seedChecklist("Shift Lead",        9) },
  { id: "5",  fullName: "Marcus Green",     employeeType: "Sales Associate",   store: "SE Portage",      startDate: "2026-03-10", checklist: seedChecklist("Sales Associate",   2) },
  { id: "6",  fullName: "Aisha Thompson",   employeeType: "Senior Trainer",    store: "PC Portage",      startDate: "2026-01-27", checklist: seedChecklist("Senior Trainer",    8) },
  { id: "7",  fullName: "Caleb Nguyen",     employeeType: "MOD",               store: "PC Jackson",      startDate: "2026-02-03", checklist: seedChecklist("MOD",              8) },
  { id: "8",  fullName: "Brianna Scott",    employeeType: "Sales Associate",   store: "PC Novi",         startDate: "2026-03-17", checklist: seedChecklist("Sales Associate",   1) },
  { id: "9",  fullName: "Elijah Harris",    employeeType: "Assistant Manager", store: "PC Canton",       startDate: "2026-01-06", checklist: seedChecklist("Assistant Manager", 10) },
  { id: "10", fullName: "Savannah Moore",   employeeType: "Buyer",             store: "PC Ann Arbor",    startDate: "2026-02-10", checklist: seedChecklist("Buyer",             6) },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SortKey = "fullName" | "employeeType" | "store" | "startDate" | "progress";
type SortDir = "asc" | "desc";

const STORES = ["PC Portage", "SE Portage", "PC East Lansing", "PC Jackson", "PC Ann Arbor", "PC Canton", "PC Novi"];
const EMPLOYEE_TYPES: EmployeeType[] = ["Sales Associate", "Buyer", "Shift Lead", "MOD", "Senior Trainer", "Assistant Manager", "Store Manager"];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getProgress(emp: Employee): number {
  const items = ROLE_CHECKLISTS[emp.employeeType];
  if (!items.length) return 0;
  const done = items.filter((item) => emp.checklist[item]).length;
  return Math.round((done / items.length) * 100);
}

const EMPLOYEE_TYPE_COLORS: Record<EmployeeType, string> = {
  "Sales Associate":   "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Buyer":             "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Shift Lead":        "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "MOD":               "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Senior Trainer":    "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Assistant Manager": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Store Manager":     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function progressColor(pct: number) {
  if (pct === 100) return "bg-emerald-500";
  if (pct >= 70)   return "bg-primary";
  if (pct >= 40)   return "bg-amber-500";
  return "bg-rose-500";
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp className="h-3 w-3 opacity-20" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3 w-3 text-primary" />
    : <ChevronDown className="h-3 w-3 text-primary" />;
}

// ─── Add Employee Modal ───────────────────────────────────────────────────────

function AddEmployeeModal({
  onAdd,
  onClose,
  myTier,
}: {
  onAdd: (emp: Employee) => void;
  onClose: () => void;
  myTier: UserTier;
}) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [employeeType, setEmployeeType] = useState<EmployeeType>("Sales Associate");
  const [store, setStore] = useState(STORES[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState<UserTier>(CAN_CREATE[myTier][0] ?? "standard");
  const [error, setError] = useState("");

  const allowedTiers = CAN_CREATE[myTier];

  const createUser = useMutation({
    mutationFn: (body: object) =>
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to create user");
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app-users"] }),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setError("");

    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    const [firstName, ...rest] = fullName.trim().split(" ");
    const lastName = rest.join(" ") || firstName!;

    try {
      await createUser.mutateAsync({
        email,
        password,
        firstName,
        lastName,
        tier,
        role: employeeType,
        storeId: tier === "standard" ? APP_STORES.find((s) => s.name === store)?.id : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
      return;
    }

    onAdd({
      id: Date.now().toString(),
      fullName: fullName.trim(),
      employeeType,
      store,
      startDate,
      checklist: {},
    });
  }

  const inputCls = "w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/70 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card border border-border/60 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <h2 className="text-sm font-semibold">Add Employee</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Login credentials */}
          <div className="space-y-3 pb-3 border-b border-border/40">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-primary/70">Login Account</p>
            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@email.com"
                className={inputCls}
                required
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>Temporary Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={inputCls}
                required
                minLength={6}
              />
            </div>
            {allowedTiers.length > 0 && (
              <div>
                <label className={labelCls}>Access Level</label>
                <select value={tier} onChange={(e) => setTier(e.target.value as UserTier)} className={inputCls}>
                  {allowedTiers.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Training info */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">Training Details</p>
            <div>
              <label className={labelCls}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="First Last"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Training Role</label>
              <select value={employeeType} onChange={(e) => setEmployeeType(e.target.value as EmployeeType)} className={inputCls}>
                {EMPLOYEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Store</label>
              <select value={store} onChange={(e) => setStore(e.target.value)} className={inputCls}>
                {STORES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          {error && <p className="text-[12px] text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={!fullName.trim() || !email.trim() || createUser.isPending}
              className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {createUser.isPending ? "Adding…" : "Add Employee"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Employee Detail View ─────────────────────────────────────────────────────

function EmployeeDetail({
  employee,
  onBack,
  onToggle,
  onChangeRole,
}: {
  employee: Employee;
  onBack: () => void;
  onToggle: (item: string) => void;
  onChangeRole: (newType: EmployeeType) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pendingRole, setPendingRole] = useState<EmployeeType>(employee.employeeType);

  const items = ROLE_CHECKLISTS[employee.employeeType];
  const pdfs = ROLE_PDFS[employee.employeeType];
  const progress = getProgress(employee);
  const completedCount = items.filter((item) => employee.checklist[item]).length;

  function handleSaveRole() {
    if (pendingRole !== employee.employeeType) {
      onChangeRole(pendingRole);
    }
    setEditing(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Training
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">{employee.fullName}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {editing ? (
                <>
                  <select
                    value={pendingRole}
                    onChange={(e) => setPendingRole(e.target.value as EmployeeType)}
                    className="text-[12px] rounded-lg bg-muted/50 border border-border/70 px-2.5 py-1 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                  >
                    {EMPLOYEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button
                    onClick={handleSaveRole}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    Save
                  </button>
                  <button
                    onClick={() => { setPendingRole(employee.employeeType); setEditing(false); }}
                    className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${EMPLOYEE_TYPE_COLORS[employee.employeeType]}`}>
                    {employee.employeeType}
                  </span>
                  <button
                    onClick={() => { setPendingRole(employee.employeeType); setEditing(true); }}
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
                    title="Edit role"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit Role
                  </button>
                </>
              )}
              <span className="text-[12px] text-muted-foreground">{employee.store}</span>
              <span className="text-[12px] text-muted-foreground">·</span>
              <span className="text-[12px] text-muted-foreground">Started {formatDate(employee.startDate)}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-display font-bold tabular-nums leading-none" style={{ color: progress === 100 ? "rgb(52 211 153)" : undefined }}>
              {progress}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{completedCount} / {items.length} complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-muted/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor(progress)}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Checklist */}
        <Card className="md:col-span-2">
          <CardHeader className="px-5 py-4 border-b border-border/60">
            <CardTitle className="text-sm">Training Checklist — {employee.employeeType}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/40">
              {items.map((item) => {
                const checked = !!employee.checklist[item];
                return (
                  <li key={item}>
                    <button
                      onClick={() => onToggle(item)}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-muted/15 transition-colors group"
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked ? "bg-primary border-primary" : "border-border/60 group-hover:border-primary/50"}`}>
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className={`text-[13px] leading-snug transition-colors ${checked ? "line-through text-muted-foreground/60" : "text-foreground"}`}>
                        {item}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* PDF Downloads */}
        <Card>
          <CardHeader className="px-5 py-4 border-b border-border/60">
            <CardTitle className="text-sm">Training Documents</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {pdfs.map((pdf) => (
              <button
                key={pdf}
                onClick={() => {
                  // Placeholder: files would be served from /training-docs/
                  alert(`"${pdf}" — upload the PDF to dashboard/public/training-docs/ to enable downloads.`);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group text-left"
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                <span className="text-[12px] text-foreground/80 group-hover:text-foreground flex-1 leading-snug transition-colors">{pdf}</span>
                <Download className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
              </button>
            ))}
            <p className="text-[10px] text-muted-foreground/60 pt-1 leading-relaxed">
              Place PDFs in <code className="font-mono text-[10px]">public/training-docs/</code> to enable downloads.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── App Access Panel ─────────────────────────────────────────────────────────

interface AppUser {
  id: string; email: string; firstName: string; lastName: string;
  tier: UserTier; role: string; storeId?: string;
}

function AppAccessPanel() {
  const { data, isLoading } = useQuery<{ users: AppUser[] }>({
    queryKey: ["app-users"],
    queryFn: () => fetch("/api/users", { credentials: "include" }).then((r) => r.json()),
  });

  const storeName = (id?: string) => APP_STORES.find((s) => s.id === id)?.name ?? "—";
  const users = data?.users ?? [];

  const TIER_COLORS: Record<UserTier, string> = {
    admin:         "text-amber-400 bg-amber-400/10 border-amber-400/20",
    dm:            "text-primary bg-primary/10 border-primary/20",
    store_manager: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    standard:      "text-muted-foreground bg-muted/40 border-border/40",
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/40 bg-muted/10">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Current App Users ({users.length})
        </p>
      </div>
      {users.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground text-center">No users yet. Add one above.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Name</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Role</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Store</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-[13px]">{u.firstName} {u.lastName}</p>
                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-2.5 text-[13px]">{u.role}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center text-[10px] font-semibold border rounded-full px-2 py-0.5 ${TIER_COLORS[u.tier]}`}>
                    {TIER_LABELS[u.tier]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[13px] text-muted-foreground">
                  {u.tier === "standard" ? storeName(u.storeId) : "All stores"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Main Training Page ───────────────────────────────────────────────────────

export default function Training() {
  const { user: me } = useAuth();
  const [tab, setTab] = useState<"training" | "app-access">("training");
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("startDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStore, setFilterStore] = useState<string | null>(null);

  const selectedEmployee = employees.find((e) => e.id === selectedId) ?? null;

  function handleSort(col: SortKey) {
    if (col === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col);
      setSortDir("asc");
    }
  }

  function handleToggle(employeeId: string, item: string) {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? { ...emp, checklist: { ...emp.checklist, [item]: !emp.checklist[item] } }
          : emp
      )
    );
  }

  function handleAdd(emp: Employee) {
    setEmployees((prev) => [emp, ...prev]);
    setShowAddModal(false);
  }

  function handleChangeRole(employeeId: string, newType: EmployeeType) {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? { ...emp, employeeType: newType, checklist: {} }
          : emp
      )
    );
  }

  const filtered = useMemo(() => {
    let rows = employees.map((e) => ({ ...e, _progress: getProgress(e) }));
    if (filterType)  rows = rows.filter((r) => r.employeeType === filterType);
    if (filterStore) rows = rows.filter((r) => r.store === filterStore);
    rows.sort((a, b) => {
      let av: string | number = a[sortKey as keyof typeof a] as string | number;
      let bv: string | number = b[sortKey as keyof typeof b] as string | number;
      if (sortKey === "progress") { av = a._progress; bv = b._progress; }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [employees, sortKey, sortDir, filterType, filterStore]);

  const hasFilters = filterType || filterStore;

  // ── Detail view ──
  if (selectedEmployee) {
    return (
      <EmployeeDetail
        employee={selectedEmployee}
        onBack={() => setSelectedId(null)}
        onToggle={(item) => handleToggle(selectedEmployee.id, item)}
        onChangeRole={(newType) => handleChangeRole(selectedEmployee.id, newType)}
      />
    );
  }

  // ── List view ──
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showAddModal && me && <AddEmployeeModal onAdd={handleAdd} onClose={() => setShowAddModal(false)} myTier={me.tier} />}
      {showAddUserModal && me && <AddUserModal onClose={() => setShowAddUserModal(false)} myTier={me.tier} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-display font-bold tracking-tight">Training</h1>
        <div className="flex items-center gap-2">
          {tab === "training" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Employee
            </button>
          )}
          {tab === "app-access" && me && CAN_CREATE[me.tier].length > 0 && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted/50 rounded-lg p-0.5 border border-border/40 w-fit">
        {(["training", "app-access"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-all ${
              tab === t
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "training" ? "Training Checklists" : "App Access"}
          </button>
        ))}
      </div>

      {/* App Access tab */}
      {tab === "app-access" && <AppAccessPanel />}

      {/* Table card — training tab only */}
      {tab === "training" && <><Card>
        <CardHeader className="px-5 py-4 border-b border-border/60">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm">In Training</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Click an employee to view their checklist. Click any type or store to filter.
              </p>
            </div>
            {hasFilters && (
              <button
                onClick={() => { setFilterType(null); setFilterStore(null); }}
                className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>

          {hasFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {filterType && (
                <span className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {filterType}
                  <button onClick={() => setFilterType(null)} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                </span>
              )}
              {filterStore && (
                <span className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {filterStore}
                  <button onClick={() => setFilterStore(null)} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/60">
                  {(
                    [
                      { key: "fullName",     label: "Full Name" },
                      { key: "employeeType", label: "Role" },
                      { key: "store",        label: "Store" },
                      { key: "startDate",    label: "Start Date" },
                      { key: "progress",     label: "Progress" },
                    ] as { key: SortKey; label: string }[]
                  ).map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        {label}
                        <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No employees match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp) => {
                    const pct = emp._progress;
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedId(emp.id)}
                        className="hover:bg-muted/15 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-2.5 text-[13px] font-medium text-foreground">
                          {emp.fullName}
                        </td>
                        <td className="px-5 py-2.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setFilterType((prev) => prev === emp.employeeType ? null : emp.employeeType); }}
                            className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all hover:opacity-80 ${EMPLOYEE_TYPE_COLORS[emp.employeeType]} ${filterType === emp.employeeType ? "ring-1 ring-primary/50" : ""}`}
                          >
                            {emp.employeeType}
                          </button>
                        </td>
                        <td className="px-5 py-2.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setFilterStore((prev) => prev === emp.store ? null : emp.store); }}
                            className={`text-[13px] text-foreground/80 hover:text-primary transition-colors ${filterStore === emp.store ? "text-primary font-medium" : ""}`}
                          >
                            {emp.store}
                          </button>
                        </td>
                        <td className="px-5 py-2.5 text-[13px] text-foreground/70 tabular-nums">
                          {formatDate(emp.startDate)}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-[100px]">
                            <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${progressColor(pct)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-[12px] font-semibold tabular-nums w-9 text-right ${pct === 100 ? "text-emerald-400" : "text-foreground/70"}`}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Showing {filtered.length} of {employees.length} employees{hasFilters ? " (filtered)" : ""}.
      </p></>}
    </div>
  );
}
