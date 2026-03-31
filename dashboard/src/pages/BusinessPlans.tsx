import { useState, useRef } from "react";
import {
  BookOpen, Building2, ChevronRight, Upload, Loader2,
  Download, RotateCcw, CheckCircle2, FileSpreadsheet, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STORES = [
  { id: "pc-80726", name: "PC Ann Arbor (#80726)" },
  { id: "pc-80783", name: "PC Canton (#80783)" },
  { id: "pc-80185", name: "PC East Lansing (#80185)" },
  { id: "pc-80634", name: "PC Jackson (#80634)" },
  { id: "pc-80237", name: "PC Portage (#80237)" },
  { id: "pc-80877", name: "PC Novi (#80877)" },
  { id: "se-60039", name: "SE Portage (#60039)" },
];

type Step = "landing" | "store" | "upload" | "analyzing" | "settings" | "expenses" | "generating" | "done";

interface CapData { sales2025: number[]; sales2024: number[] }
interface FieldSuggestion {
  fieldId: string;
  label: string;
  cell: string;
  type: string;
  qboLines: string[];
  suggestedValue: number;
  confidence: "high" | "medium" | "low" | "none";
  note: string;
}

// ── Shared form primitives ────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-foreground/70">{children}</span>;
}

function NumInput({
  label, value, onChange, hint, placeholder, prefix, suffix,
}: {
  label: string; value: string; onChange: (v: string) => void;
  hint?: string; placeholder?: string; prefix?: string; suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-sm text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-9 w-full rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary",
            prefix ? "pl-7 pr-3" : suffix ? "pl-3 pr-8" : "px-3",
          )}
        />
        {suffix && <span className="absolute right-3 text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StrInput({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

// ── File drop zone ────────────────────────────────────────────────────────────
function FileDrop({ label, accept, file, onFile }: {
  label: string; accept: string; file: File | null; onFile: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-6 cursor-pointer transition-colors",
        drag ? "border-primary bg-primary/5" :
        file ? "border-green-500/50 bg-green-500/5" :
               "border-border hover:border-primary/50 hover:bg-muted/30",
      )}
    >
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {file ? (
        <>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <p className="text-sm font-medium text-green-600 text-center break-all">{file.name}</p>
          <p className="text-xs text-muted-foreground">click to replace</p>
        </>
      ) : (
        <>
          <Upload className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium text-center">{label}</p>
          <p className="text-xs text-muted-foreground">click or drag & drop (.xlsx or .csv)</p>
        </>
      )}
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
const STEP_LABELS = ["Store", "Files", "Settings", "Expenses", "Generate"];
const STEP_NUMS: Record<Step, number> = {
  landing: -1, store: 0, upload: 1, analyzing: 1,
  settings: 2, expenses: 3, generating: 4, done: 4,
};

function StepBar({ step }: { step: Step }) {
  const current = STEP_NUMS[step];
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
      {STEP_LABELS.map((label, i) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold shrink-0",
            i < current  ? "bg-primary text-primary-foreground" :
            i === current? "bg-primary/20 text-primary border border-primary/40" :
                           "bg-muted text-muted-foreground",
          )}>{i + 1}</span>
          <span className={i === current ? "text-foreground font-medium" : ""}>{label}</span>
          {i < STEP_LABELS.length - 1 && <span className="text-muted-foreground/40">›</span>}
        </span>
      ))}
    </div>
  );
}

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfBadge({ confidence }: { confidence: string }) {
  const map: Record<string, string> = {
    high:   "bg-green-500/10 text-green-600 border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    low:    "bg-orange-500/10 text-orange-600 border-orange-500/20",
    none:   "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", map[confidence] || map.none)}>
      {confidence}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BusinessPlans() {
  const [step, setStep] = useState<Step>("landing");
  const [storeId, setStoreId]   = useState("");
  const [qboFile, setQboFile]   = useState<File | null>(null);
  const [capFile, setCapFile]   = useState<File | null>(null);
  const [error, setError]       = useState("");

  // Analyze results
  const [capData,    setCapData]    = useState<CapData | null>(null);
  const [fields,     setFields]     = useState<FieldSuggestion[]>([]);

  // Settings form
  const [planYear,         setPlanYear]        = useState(String(new Date().getFullYear() + 1));
  const [salesY1,          setSalesY1]         = useState("");
  const [salesY2Growth,    setSalesY2Growth]   = useState("6");
  const [usedPct,          setUsedPct]         = useState("99");
  const [ownerSalary,      setOwnerSalary]     = useState("0");
  const [managerSalary,    setManagerSalary]   = useState("60000");
  const [hourlyLaborPct,   setHourlyLaborPct]  = useState("18");
  const [cashBalance,      setCashBalance]     = useState("0");
  const [locBalance,       setLocBalance]      = useState("0");
  const [inventoryUsed,    setInventoryUsed]   = useState("");
  const [inventoryNew,     setInventoryNew]    = useState("0");

  // Store header
  const [franchisee, setFranchisee] = useState("Bob, Lori & Adam Brown");
  const [location,   setLocation]   = useState("");

  // Expense field values (fieldId → string value for input)
  const [expenseValues, setExpenseValues] = useState<Record<string, string>>({});

  const setExp = (id: string) => (v: string) => setExpenseValues((ev) => ({ ...ev, [id]: v }));

  // ── Analyze ──────────────────────────────────────────────────────────────────
  async function runAnalyze() {
    if (!qboFile || !capFile || !storeId) return;
    setError("");
    setStep("analyzing");
    try {
      const form = new FormData();
      form.append("storeId", storeId);
      form.append("qboFile", qboFile);
      form.append("capFile", capFile);

      const res = await fetch("/api/bp/analyze", { method: "POST", body: form });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(e.error || res.statusText);
      }
      const data = await res.json();
      setCapData(data.capData);
      setFields(data.fields || []);

      // Pre-fill expense values from suggestions
      const initExp: Record<string, string> = {};
      (data.fields as FieldSuggestion[] || []).forEach((f) => {
        initExp[f.fieldId] = f.suggestedValue !== 0 ? String(f.suggestedValue) : "";
      });
      setExpenseValues(initExp);

      // Pre-fill saved headers
      const h = data.savedHeaders || {};
      if (h.franchisee)    setFranchisee(String(h.franchisee));
      if (h.location)      setLocation(String(h.location));
      if (h.managerSalary) setManagerSalary(String(h.managerSalary));
      if (h.inventoryUsed) setInventoryUsed(String(h.inventoryUsed));

      setLocation(STORES.find((s) => s.id === storeId)?.name.replace(/ \(.*/, "") || "");
      setStep("settings");
    } catch (e) {
      setError(String(e));
      setStep("upload");
    }
  }

  // ── Generate ─────────────────────────────────────────────────────────────────
  async function runGenerate() {
    if (!capData) return;
    setError("");
    setStep("generating");
    try {
      // Build confirmed fields as numbers
      const confirmedFields: Record<string, number> = {};
      fields.forEach((f) => {
        const raw = expenseValues[f.fieldId];
        const val = parseFloat(raw ?? "");
        if (!isNaN(val)) confirmedFields[f.fieldId] = val;
      });

      const body = {
        storeId,
        capData,
        planYear:        Number(planYear),
        salesY1:         Number(salesY1),
        salesY2growthPct: Number(salesY2Growth),
        usedPct:         Number(usedPct),
        ownerSalary:     Number(ownerSalary),
        managerSalary:   Number(managerSalary),
        hourlyLaborPct:  Number(hourlyLaborPct),
        cashBalance:     Number(cashBalance),
        locBalance:      Number(locBalance),
        inventoryUsed:   Number(inventoryUsed) || 0,
        inventoryNew:    Number(inventoryNew)  || 0,
        confirmedFields,
        storeHeader: { franchisee, location, ownerName: franchisee, managerSalary: Number(managerSalary), inventoryUsed: Number(inventoryUsed) || 0 },
      };

      const res = await fetch("/api/bp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(e.error || res.statusText);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `BP_${storeId}_${planYear}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setStep("done");
    } catch (e) {
      setError(String(e));
      setStep("expenses");
    }
  }

  function reset() {
    setStep("landing"); setStoreId(""); setQboFile(null); setCapFile(null);
    setCapData(null); setFields([]); setError("");
    setExpenseValues({});
    setSalesY1(""); setSalesY2Growth("6"); setUsedPct("99");
    setOwnerSalary("0"); setManagerSalary("60000");
    setHourlyLaborPct("18"); setCashBalance("0"); setLocBalance("0");
    setInventoryUsed(""); setInventoryNew("0");
  }

  const storeName = STORES.find((s) => s.id === storeId)?.name || "";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-display font-bold tracking-tight">Business Plans</h1>
        </div>
        <p className="text-sm text-muted-foreground">Generate annual business plans for each store.</p>
      </div>

      {/* Landing */}
      {step === "landing" && (
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl">
          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Coming soon</span>
              </div>
              <CardTitle className="text-base mt-3">Eagle V Business Plan</CardTitle>
              <CardDescription className="text-sm">Internal Eagle V annual plan with cross-store benchmarks.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setStep("store")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <CardTitle className="text-base mt-3">Winmark Business Plan</CardTitle>
              <CardDescription className="text-sm">
                Generate a completed Winmark Business Plan Excel file. Upload your QBO P&L and CAP report — the app maps expenses, fills every input field, and exports the exact format Winmark expects.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Wizard */}
      {step !== "landing" && (
        <div className="max-w-2xl space-y-5">
          <StepBar step={step} />

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Step 1: Store ── */}
          {step === "store" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select a store</CardTitle>
                <CardDescription>Choose the store this plan is for.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  {STORES.map((s) => (
                    <button key={s.id} onClick={() => setStoreId(s.id)}
                      className={cn("text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                        storeId === s.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 hover:bg-muted/30")}>
                      {s.name}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between pt-2">
                  <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                  <button onClick={() => storeId && setStep("upload")} disabled={!storeId}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors">
                    Continue →
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step 2: Upload ── */}
          {step === "upload" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload reports</CardTitle>
                <CardDescription>
                  Both files are required for <strong>{storeName}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileDrop label="QuickBooks P&L by Class (Excel or CSV)" accept=".xlsx,.csv" file={qboFile} onFile={setQboFile} />
                <FileDrop label="CAP Report (Excel)" accept=".xlsx" file={capFile} onFile={setCapFile} />
                <div className="rounded-md bg-muted/40 border border-border px-3 py-2.5 text-xs text-muted-foreground space-y-1">
                  <p><strong>QBO:</strong> Profit and Loss by Class, full calendar year, all stores as columns.</p>
                  <p><strong>CAP:</strong> Combined store report — the app uses it only for monthly sales index data.</p>
                </div>
                <div className="flex justify-between pt-2">
                  <button onClick={() => setStep("store")} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                  <button onClick={runAnalyze} disabled={!qboFile || !capFile}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors">
                    Analyze →
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Analyzing ── */}
          {step === "analyzing" && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm font-medium">Parsing files and mapping expenses…</p>
                <p className="text-xs text-muted-foreground">Claude is analyzing QBO line items against Winmark fields.</p>
              </CardContent>
            </Card>
          )}

          {/* ── Step 3: Settings ── */}
          {step === "settings" && (
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Store info</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <StrInput label="Franchisee / Owner name" value={franchisee} onChange={setFranchisee} placeholder="Bob, Lori & Adam Brown" />
                  <StrInput label="Store location (city)" value={location} onChange={setLocation} placeholder="Ann Arbor" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sales plan</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <NumInput label="Plan year" value={planYear} onChange={setPlanYear} placeholder="2026" />
                  <NumInput label="Year 1 sales goal" value={salesY1} onChange={setSalesY1} prefix="$" placeholder="1550000" hint="Total sales target for Year 1" />
                  <NumInput label="Year 2 growth %" value={salesY2Growth} onChange={setSalesY2Growth} suffix="%" placeholder="6" />
                  <NumInput label="Used % of sales" value={usedPct} onChange={setUsedPct} suffix="%" placeholder="99" hint="Typically 99% for Plato's Closet" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Compensation &amp; labor</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <NumInput label="Owner salary (annual)" value={ownerSalary} onChange={setOwnerSalary} prefix="$" placeholder="0" hint="Enter 0 if owner takes draws instead" />
                  <NumInput label="Manager salary (annual)" value={managerSalary} onChange={setManagerSalary} prefix="$" placeholder="60000" />
                  <NumInput label="Hourly labor % of sales" value={hourlyLaborPct} onChange={setHourlyLaborPct} suffix="%" placeholder="18" hint="Total hourly staff payroll ÷ total sales. Does not include manager." />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Balance sheet</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <NumInput label="Cash balance (day 1 of plan)" value={cashBalance} onChange={setCashBalance} prefix="$" />
                  <NumInput label="Line of credit outstanding" value={locBalance} onChange={setLocBalance} prefix="$" />
                  <NumInput label="Used inventory @ cost" value={inventoryUsed} onChange={setInventoryUsed} prefix="$" placeholder="98250" hint="Current used inventory cost basis" />
                  <NumInput label="New inventory @ cost" value={inventoryNew} onChange={setInventoryNew} prefix="$" placeholder="0" />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <button onClick={() => setStep("upload")} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                <button onClick={() => setStep("expenses")} disabled={!salesY1}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors">
                  Review expenses →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Expense mappings ── */}
          {step === "expenses" && (
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Expense mappings</CardTitle>
                  <CardDescription>
                    Review each field. The values were suggested by Claude based on your QBO data — confirm or override any that need adjustment.
                    <br className="mt-1" />
                    <span className="text-[11px]">
                      <strong>$/mo fields</strong> = enter monthly dollar amount.{" "}
                      <strong>% fields</strong> = enter as a decimal (e.g. 5% → 0.05).
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0 -mx-1">
                    {/* Header row */}
                    <div className="grid grid-cols-[1fr_80px_100px_120px] gap-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Field</span>
                      <span>Cell</span>
                      <span>Confidence</span>
                      <span>Value</span>
                    </div>

                    {fields.map((f, i) => (
                      <div key={f.fieldId}
                        className={cn(
                          "grid grid-cols-[1fr_80px_100px_120px] gap-2 items-start px-2 py-2.5 rounded-lg",
                          i % 2 === 0 ? "bg-muted/20" : "",
                        )}>
                        <div>
                          <p className="text-xs font-semibold leading-tight">{f.label}</p>
                          {f.qboLines.length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                              QBO: {f.qboLines.join(" + ")}
                            </p>
                          )}
                          {f.confidence === "low" || f.confidence === "none" ? (
                            <p className="text-[10px] text-orange-500 mt-0.5 leading-snug">{f.note}</p>
                          ) : null}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground pt-1">{f.cell}</span>
                        <span className="pt-0.5"><ConfBadge confidence={f.confidence} /></span>
                        <input
                          type="number"
                          step="any"
                          value={expenseValues[f.fieldId] ?? ""}
                          onChange={(e) => setExp(f.fieldId)(e.target.value)}
                          className="h-7 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right"
                          placeholder={f.type === "pct_sales" || f.type === "pct_payroll" ? "0.000" : "0"}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <button onClick={() => setStep("settings")} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                <button onClick={runGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Download className="h-4 w-4" />
                  Generate Excel
                </button>
              </div>
            </div>
          )}

          {/* ── Generating ── */}
          {step === "generating" && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm font-medium">Filling business plan template…</p>
                <p className="text-xs text-muted-foreground">Writing all input fields and exporting Excel.</p>
              </CardContent>
            </Card>
          )}

          {/* ── Done ── */}
          {step === "done" && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <div>
                  <p className="text-base font-semibold">Business plan downloaded</p>
                  <p className="text-sm text-muted-foreground mt-1">{storeName} — {planYear} Winmark Business Plan</p>
                  <p className="text-xs text-muted-foreground mt-1">Open in Excel — all formula sheets will recalculate automatically.</p>
                </div>
                <button onClick={reset}
                  className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Generate another
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
