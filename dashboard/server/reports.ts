import { Router } from "express";
import fs from "fs/promises";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUTS_DIR = path.resolve(__dirname, "../01-inputs");
const PULLER_DIR = path.resolve(__dirname, "../../tools/winmark-puller");
const PULL_SCRIPT = path.join(PULLER_DIR, "daily_pull.sh");

const STORE_NUMBER_MAP: Record<string, string> = {
  "80237": "pc-80237",
  "60039": "se-60039",
  "80185": "pc-80185",
  "80634": "pc-80634",
  "80726": "pc-80726",
  "80783": "pc-80783",
  "80877": "pc-80877",
};

const STORE_ID_TO_NUM: Record<string, string> = Object.fromEntries(
  Object.entries(STORE_NUMBER_MAP).map(([num, id]) => [id, num])
);

interface StoreVisitData {
  storeId: string;
  storeNum: string;
  dateRange: string; // e.g. "3/1-3/31/25"
  // Sales
  sales: number | null;
  salesLY: number | null;
  salesComp: string | null;
  avgTrx: number | null;
  avgTrxLY: number | null;
  avgTrxComp: string | null;
  avgItems: number | null;
  avgItemsLY: number | null;
  trxCount: number | null;
  trxCountLY: number | null;
  gmPct: string | null;
  gmPctLY: string | null;
  gmDol: number | null;
  // Buys
  buys: number | null;
  buysLY: number | null;
  buysComp: string | null;
  buyCount: number | null;
  buyCountLY: number | null;
  avgItemsPerBuy: number | null;
  unitCost: number | null;
  unitRetail: number | null;
}

// KPI report only tracks inventory cost (current vs last year).
// Source columns: Textbox63 = total current cost, Textbox68 = total LY cost.
// These totals appear on every inventory row — we grab from the first one we find.
interface KpiData {
  storeId: string;
  storeNum: string;
  asOfDate: string;
  currentInventoryCost: number | null;  // "Current Cost" — total on-hand at cost TY
  lyInventoryCost: number | null;        // "Last Year Cost" — total on-hand at cost LY
}

interface AvailableReport {
  type: "store_visit" | "kpi";
  storeId: string;
  storeNum: string;
  startDate?: string;
  endDate?: string;
  asOfDate?: string;
  fileName: string;
}

// Simple CSV row parser
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function parseDollar(s: string): number | null {
  if (!s || s === "" || s === '""') return null;
  const n = parseFloat(s.replace(/[$,"\s]/g, ""));
  return isNaN(n) ? null : n;
}

function parseIntVal(s: string): number | null {
  if (!s || s === "") return null;
  const n = parseInt(s.replace(/[,"\s]/g, ""), 10);
  return isNaN(n) ? null : n;
}

function parseFloatVal(s: string): number | null {
  if (!s || s === "") return null;
  const n = parseFloat(s.replace(/[,"\s]/g, ""));
  return isNaN(n) ? null : n;
}

function cleanStr(s: string): string {
  return s.replace(/^"|"$/g, "").trim();
}

function parseStoreVisitCSV(content: string, storeNum: string): StoreVisitData | null {
  const storeId = STORE_NUMBER_MAP[storeNum];
  if (!storeId) return null;

  const lines = content.replace(/^\uFEFF/, "").split("\n").map((l) => l.trim());

  // Sales section
  const salesHeaderIdx = lines.findIndex((l) => l.startsWith("Sales_TYLbl"));
  if (salesHeaderIdx === -1) return null;
  const salesHeaders = parseCSVRow(lines[salesHeaderIdx]);
  const salesData = parseCSVRow(lines[salesHeaderIdx + 1] ?? "");
  const getS = (k: string) => cleanStr(salesData[salesHeaders.indexOf(k)] ?? "");

  // Buys section
  const buysHeaderIdx = lines.findIndex((l) => l.startsWith("Buys_TYLbl"));
  const buysHeaders = buysHeaderIdx !== -1 ? parseCSVRow(lines[buysHeaderIdx]) : [];
  const buysData = buysHeaderIdx !== -1 ? parseCSVRow(lines[buysHeaderIdx + 1] ?? "") : [];
  const getB = (k: string) => cleanStr(buysData[buysHeaders.indexOf(k)] ?? "");

  return {
    storeId,
    storeNum,
    dateRange: cleanStr(getS("Sales_TYLbl")),
    sales: parseDollar(getS("Sales_YTDTY")),
    salesLY: parseDollar(getS("Sales_YTDLY")),
    salesComp: cleanStr(getS("Sales_YTDComp")) || null,
    avgTrx: parseDollar(getS("Sales_AvgTrxTY")),
    avgTrxLY: parseDollar(getS("Sales_AvgTrxLY")),
    avgTrxComp: cleanStr(getS("Sales_AvgTrxComp")) || null,
    avgItems: parseFloatVal(getS("Sales_AvgItemsTY")),
    avgItemsLY: parseFloatVal(getS("Sales_AvgItemsLY")),
    trxCount: parseIntVal(getS("Sales_TrxCountYTDTY")),
    trxCountLY: parseIntVal(getS("Sales_TrxCountYTDLY")),
    gmPct: cleanStr(getS("Sales_GMPctYTDTY")) || null,
    gmPctLY: cleanStr(getS("Sales_GMPctYTDLY")) || null,
    gmDol: parseDollar(getS("Sales_GMDolYTDTY")),
    buys: parseDollar(getB("Buys_YTDTY")),
    buysLY: parseDollar(getB("Buys_YTDLY")),
    buysComp: cleanStr(getB("Buys_YTDComp")) || null,
    buyCount: parseIntVal(getB("Buys_CountTY")),
    buyCountLY: parseIntVal(getB("Buys_CountLY")),
    avgItemsPerBuy: parseFloatVal(getB("Buys_AvgItemsTY")),
    unitCost: parseDollar(getB("Buys_UnitCostYTDTY")),
    unitRetail: parseDollar(getB("Buys_UnitRetailYTDTY")),
  };
}

function parseKpiCSV(content: string, storeNum: string, asOfDate: string): KpiData | null {
  const storeId = STORE_NUMBER_MAP[storeNum];
  if (!storeId) return null;

  const lines = content.replace(/^\uFEFF/, "").split("\n").map((l) => l.trim()).filter(Boolean);

  // The KPI CSV is a multi-section file. The inventory section starts with a header
  // row containing "Department". The total columns are Textbox63 (current cost TY)
  // and Textbox68 (last year cost). These totals repeat on every inventory data row.
  const deptHeaderIdx = lines.findIndex((l) => l.startsWith("Department,"));
  if (deptHeaderIdx === -1) return null;

  const deptHeaders = parseCSVRow(lines[deptHeaderIdx]);
  const currentCostCol = deptHeaders.indexOf("Textbox63");
  const lyCostCol = deptHeaders.indexOf("Textbox68");

  // Find first data row after the Department header that has a value in Textbox63
  let currentCost: number | null = null;
  let lyCost: number | null = null;

  for (let i = deptHeaderIdx + 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    const rawCurrent = currentCostCol !== -1 ? cleanStr(row[currentCostCol] ?? "") : "";
    const rawLY = lyCostCol !== -1 ? cleanStr(row[lyCostCol] ?? "") : "";
    if (rawCurrent !== "") {
      currentCost = parseDollar(rawCurrent);
      lyCost = parseDollar(rawLY);
      break;
    }
  }

  return {
    storeId,
    storeNum,
    asOfDate,
    currentInventoryCost: currentCost,
    lyInventoryCost: lyCost,
  };
}

// List all available report files
async function listAvailableReports(): Promise<AvailableReport[]> {
  const result: AvailableReport[] = [];
  let files: string[];
  try {
    files = await fs.readdir(INPUTS_DIR);
  } catch {
    return result;
  }

  for (const file of files) {
    if (!file.endsWith(".csv")) continue;

    // store_visit_{storeNum}_{start}_{end}_{pulldate}.csv
    const svMatch = file.match(/^store_visit_(\d+)_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})_/);
    if (svMatch) {
      const storeNum = svMatch[1];
      result.push({
        type: "store_visit",
        storeId: STORE_NUMBER_MAP[storeNum] ?? storeNum,
        storeNum,
        startDate: svMatch[2],
        endDate: svMatch[3],
        fileName: file,
      });
      continue;
    }

    // kpi_{storeNum}_{date}_{pulldate}.csv
    const kpiMatch = file.match(/^kpi_(\d+)_(\d{4}-\d{2}-\d{2})_/);
    if (kpiMatch) {
      const storeNum = kpiMatch[1];
      result.push({
        type: "kpi",
        storeId: STORE_NUMBER_MAP[storeNum] ?? storeNum,
        storeNum,
        asOfDate: kpiMatch[2],
        fileName: file,
      });
    }
  }

  return result;
}

// Find best matching store visit files for a date range
async function getStoreVisitData(startDate: string, endDate: string): Promise<StoreVisitData[]> {
  const reports = await listAvailableReports();
  const results: StoreVisitData[] = [];

  // For each store, find the most recent file that covers the requested range
  const storeNums = Object.keys(STORE_NUMBER_MAP);
  for (const storeNum of storeNums) {
    const candidates = reports.filter(
      (r) =>
        r.type === "store_visit" &&
        r.storeNum === storeNum &&
        r.startDate === startDate &&
        r.endDate === endDate
    );
    // Pick most recent pull (highest pulldate — last part of filename)
    candidates.sort((a, b) => b.fileName.localeCompare(a.fileName));
    const best = candidates[0];
    if (!best) continue;

    try {
      const content = await fs.readFile(path.join(INPUTS_DIR, best.fileName), "utf-8");
      const data = parseStoreVisitCSV(content, storeNum);
      if (data) results.push(data);
    } catch {
      // skip
    }
  }
  return results;
}

// Get most recent KPI snapshot for each store
async function getLatestKpiData(): Promise<KpiData[]> {
  const reports = await listAvailableReports();
  const results: KpiData[] = [];
  const seen = new Set<string>();

  // Sort by asOfDate descending + then fileName (most recent pull last)
  const kpiReports = reports
    .filter((r) => r.type === "kpi")
    .sort((a, b) => {
      const dateComp = (b.asOfDate ?? "").localeCompare(a.asOfDate ?? "");
      return dateComp !== 0 ? dateComp : b.fileName.localeCompare(a.fileName);
    });

  for (const r of kpiReports) {
    if (seen.has(r.storeNum)) continue;
    seen.add(r.storeNum);
    try {
      const content = await fs.readFile(path.join(INPUTS_DIR, r.fileName), "utf-8");
      const data = parseKpiCSV(content, r.storeNum, r.asOfDate ?? "");
      if (data) results.push(data);
    } catch {
      // skip
    }
  }
  return results;
}

const router = Router();

// GET /api/reports/available — list date ranges that have been pulled
router.get("/reports/available", async (_req, res) => {
  const reports = await listAvailableReports();
  // Unique date ranges for store visit reports
  const ranges = new Map<string, { startDate: string; endDate: string; stores: string[] }>();
  for (const r of reports) {
    if (r.type !== "store_visit" || !r.startDate || !r.endDate) continue;
    const key = `${r.startDate}|${r.endDate}`;
    if (!ranges.has(key)) ranges.set(key, { startDate: r.startDate, endDate: r.endDate, stores: [] });
    ranges.get(key)!.stores.push(r.storeId);
  }
  res.json({
    storeVisitRanges: [...ranges.values()].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    kpiAvailable: (await listAvailableReports()).some((r) => r.type === "kpi"),
  });
});

// GET /api/reports/store-visit?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get("/reports/store-visit", async (req, res) => {
  const { start, end } = req.query as { start?: string; end?: string };
  if (!start || !end) {
    res.status(400).json({ error: "start and end query params required" });
    return;
  }
  const data = await getStoreVisitData(start, end);
  res.json({ startDate: start, endDate: end, stores: data });
});

// GET /api/reports/kpi — latest KPI snapshot
router.get("/reports/kpi", async (_req, res) => {
  const data = await getLatestKpiData();
  res.json({ stores: data });
});

// POST /api/reports/pull — trigger a manual data pull
// body: { type: "store-visit" | "kpi" | "all", start?: string, end?: string }
let pullInProgress = false;
router.post("/reports/pull", async (req, res) => {
  if (pullInProgress) {
    res.status(429).json({ error: "A pull is already in progress" });
    return;
  }

  const { type = "all", start, end } = req.body as {
    type?: string;
    start?: string;
    end?: string;
  };

  pullInProgress = true;

  const scriptArgs: string[] = [];
  const python = "python3";
  const script = path.join(PULLER_DIR, "pull_report.py");

  // Build commands to run
  const commands: string[][] = [];
  if (type === "all" || type === "kpi") {
    commands.push([python, script, "kpi", "--all"]);
  }
  if (type === "all" || type === "store-visit") {
    const s = start ?? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const e = end ?? new Date().toISOString().split("T")[0];
    commands.push([python, script, "store-visit", "--all", "--start", s!, "--end", e!]);
  }

  res.json({ status: "started", message: "Data pull initiated. Refresh in a few minutes." });

  // Run commands sequentially in background
  (async () => {
    for (const [cmd, ...args] of commands) {
      await new Promise<void>((resolve) => {
        execFile(cmd!, args, { cwd: PULLER_DIR, env: { ...process.env } }, (err, stdout, stderr) => {
          if (err) console.error("Pull error:", err.message, stderr);
          else console.log("Pull output:", stdout);
          resolve();
        });
      });
    }
    pullInProgress = false;
    console.log("Manual report pull complete");
  })();
});

// GET /api/reports/pull-status
router.get("/reports/pull-status", (_req, res) => {
  res.json({ inProgress: pullInProgress });
});

export default router;
