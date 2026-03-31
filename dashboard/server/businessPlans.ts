import express, { Request, Response } from "express";
import multer from "multer";
import { createRequire } from "module";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const XLSX = require("xlsx") as typeof import("xlsx");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DATA_DIR = join(__dirname, "../data");
const TEMPLATE_PATH = join(DATA_DIR, "winmark-bp-template.xlsx");
const HEADERS_PATH = join(DATA_DIR, "bp-store-headers.json");
const MAPPINGS_PATH = join(DATA_DIR, "bp-mappings.json");

const STORE_WINMARK: Record<string, string> = {
  "pc-80726": "80726", "pc-80783": "80783", "pc-80185": "80185",
  "pc-80634": "80634", "pc-80237": "80237", "pc-80877": "80877", "se-60039": "60039",
};
const STORE_CITIES: Record<string, string> = {
  "pc-80726": "Ann Arbor",   "pc-80783": "Canton",       "pc-80185": "East Lansing",
  "pc-80634": "Jackson",     "pc-80237": "Portage",       "pc-80877": "Novi",  "se-60039": "Portage",
};

// ── Winmark expense field definitions ────────────────────────────────────────
// type: 'monthly' = $/month, 'pct_sales' = decimal % of total sales
const WINMARK_FIELDS = [
  { id: "payroll_taxes_pct",  label: "PAYROLL TAXES",                cell: "M7",  type: "pct_payroll", description: "% of total payroll. Usually 9–10%." },
  { id: "payroll_services",   label: "PAYROLL SERVICES",             cell: "M8",  type: "monthly",     description: "Monthly payroll processing fees (ADP, Paychex, etc.)" },
  { id: "workers_comp_pct",   label: "WORKERS COMP INS",             cell: "M9",  type: "pct_payroll", description: "% of total payroll. Typically 0.2–0.4%." },
  { id: "advertising_pct",    label: "ADVERTISING",                  cell: "M11", type: "pct_sales",   description: "Sum ALL advertising: Facebook, Google, Instagram, TikTok, email, print, radio, loyalty, etc. Divide by total sales." },
  { id: "accounting_fees",    label: "ACCOUNTING FEES",              cell: "M12", type: "monthly",     description: "Monthly accounting/bookkeeping fees" },
  { id: "royalty_pct",        label: "ROYALTY",                      cell: "M13", type: "pct_sales",   fixed: 0.05, description: "Fixed Winmark royalty at 5% of sales." },
  { id: "credit_card_pct",    label: "BANK/CREDIT CARD CHARGES",     cell: "M14", type: "pct_sales",   description: "Credit card processing fees. Look for 'Credit Card Fees', 'Bank Charges', or 'Processing Fees' in QBO. Divide by total sales." },
  { id: "check_guarantee",    label: "CHECK GUARANTEE",              cell: "M15", type: "pct_sales",   description: "Check processing/guarantee % of sales. Often 0 for card-only stores." },
  { id: "rent",               label: "RENT (Monthly: Base + CAM)",   cell: "M17", type: "monthly",     description: "Total monthly rent including CAM (common area maintenance). Look for 'Rent' in QBO." },
  { id: "security",           label: "SECURITY MONITORING",          cell: "M18", type: "monthly",     description: "Monthly security/alarm monitoring fee" },
  { id: "leasing",            label: "LEASING PAYMENT",              cell: "M19", type: "monthly",     description: "Monthly equipment lease payments (POS terminals, racks, etc.)" },
  { id: "repairs",            label: "REPAIRS / MAINTENANCE",        cell: "M21", type: "monthly",     description: "Average monthly repairs and maintenance." },
  { id: "travel",             label: "BUS. TRAVEL/ENTERTAIN.",       cell: "M22", type: "monthly",     description: "Average monthly business travel and entertainment." },
  { id: "vehicle",            label: "BUSINESS VEHICLE",             cell: "M23", type: "monthly",     description: "Monthly vehicle expense (payments, fuel, insurance)." },
  { id: "office_supplies_pct",label: "OFFICE SUPPLIES & EXP",        cell: "M25", type: "pct_sales",   description: "Office and store supplies. Usually ~2% of sales." },
  { id: "cell_phone",         label: "CELL PHONE",                   cell: "M26", type: "monthly",     description: "Monthly cell phone expense for store/management." },
  { id: "phone_internet",     label: "TELEPHONE/INTERNET",           cell: "M27", type: "monthly",     description: "Monthly phone and internet service." },
  { id: "utilities",          label: "UTILITIES",                    cell: "M28", type: "monthly",     description: "Monthly utilities (electric, gas, water)." },
  { id: "insurance_biz",      label: "INSURANCE-BUSINESS",           cell: "T6",  type: "monthly",     description: "Monthly business liability and property insurance. Sum all non-health insurance lines." },
  { id: "health_ins",         label: "EMPLOY. HEALTH INS.",          cell: "T7",  type: "monthly",     description: "Monthly employer-paid health insurance premiums. Look for Medical, ICHRA, Health Center lines." },
  { id: "outside_services",   label: "OUTSIDE SERVICES",             cell: "T9",  type: "monthly",     description: "Outside contractors, IT services, cleaning, pest control, etc." },
  { id: "store_operating",    label: "STORE OPERATING EXPENSE",      cell: "T10", type: "monthly",     description: "Store supplies: bags, hangers, cleaning products, register tape, etc." },
  { id: "misc_expense",       label: "MISC EXPENSE",                 cell: "T11", type: "monthly",     description: "Miscellaneous expenses that don't fit other categories." },
] as const;

type WinmarkFieldId = typeof WINMARK_FIELDS[number]["id"];

// ── Persistence ───────────────────────────────────────────────────────────────
function loadJson(path: string): Record<string, unknown> {
  try { return JSON.parse(readFileSync(path, "utf-8")); } catch { return {}; }
}
function saveJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

// ── CAP report parser — only sales index data ─────────────────────────────────
interface CapSalesData {
  sales2025: number[];  // Jan–Dec monthly totals
  sales2024: number[];
}

function parseCap(buffer: Buffer): CapSalesData | null {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]]; // (All Combined)
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: 0 }) as unknown[][];

  const salesRow = rows.find((r) => r[0] === "Sales") as (string | number)[] | undefined;
  if (!salesRow) return null;

  // Col layout: 0=label, 1-12=JAN24-DEC24, 13=empty, 14-25=JAN25-DEC25, 26=empty, 27+=JAN26+
  const extract = (row: (string | number)[], offset: number): number[] =>
    Array.from({ length: 12 }, (_, i) => Number(row[offset + i]) || 0);

  return {
    sales2025: extract(salesRow, 14),
    sales2024: extract(salesRow, 1),
  };
}

// ── QBO parser — all line items for selected store ────────────────────────────
type QboData = Record<string, number>; // label → annual TY total

function parseQbo(buffer: Buffer, storeId: string): QboData | null {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" }) as unknown[][];

  const winmarkNum = STORE_WINMARK[storeId];

  // Find the header row containing the store's Winmark number
  let headerRowIdx = -1;
  let storeColIdx  = -1;
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    for (let c = 0; c < (rows[r] as unknown[]).length; c++) {
      if (String((rows[r] as unknown[])[c]).includes(winmarkNum)) {
        headerRowIdx = r;
        storeColIdx  = c;
        break;
      }
    }
    if (headerRowIdx >= 0) break;
  }

  if (storeColIdx < 0) return null;

  const result: QboData = {};
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const label = String((rows[r] as unknown[])[0]).trim();
    if (!label) continue;
    const ty = Number((rows[r] as unknown[])[storeColIdx]) || 0;
    if (ty !== 0) result[label] = ty;
  }
  return result;
}

// ── Claude mapping suggestions ────────────────────────────────────────────────
interface FieldSuggestion {
  fieldId: string;
  label: string;
  cell: string;
  type: string;
  qboLines: string[];
  suggestedValue: number;   // monthly $ or % decimal
  confidence: "high" | "medium" | "low";
  note: string;
}

async function getClaudeMappings(
  qboData: QboData,
  savedMappings: Record<string, unknown>,
  totalSalesTY: number,
): Promise<FieldSuggestion[]> {
  const fieldList = WINMARK_FIELDS.map((f) => {
    const fixed = "fixed" in f ? ` FIXED VALUE: ${f.fixed}` : "";
    return `- ${f.id} | "${f.label}" | type:${f.type} | ${f.description}${fixed}`;
  }).join("\n");

  const qboList = Object.entries(qboData)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `  "${k}": ${v.toLocaleString()}`)
    .join("\n");

  const savedList = Object.keys(savedMappings).length
    ? JSON.stringify(savedMappings, null, 2)
    : "None";

  const prompt = `You are helping map QuickBooks P&L line items to a Winmark franchise business plan Input sheet.

WINMARK EXPENSE FIELDS (id | label | type | description):
${fieldList}

QBO P&L LINE ITEMS FOR THIS STORE (annual TY totals, non-zero only):
${qboList}

TOTAL ANNUAL SALES (TY): ${totalSalesTY.toLocaleString()}

PREVIOUSLY CONFIRMED MAPPINGS (trust these unless QBO structure has changed):
${savedList}

INSTRUCTIONS:
- For type "monthly": suggestedValue = annual QBO total / 12 (rounded to nearest dollar)
- For type "pct_sales": suggestedValue = sum of QBO lines / totalSalesTY (as decimal, e.g. 0.055)
- For type "pct_payroll": suggestedValue = leave at standard (payroll_taxes_pct → 0.09, workers_comp → 0.002)
- For fields with FIXED VALUE: always use that fixed value
- If you cannot confidently identify QBO lines, set confidence "low" and note what to look for
- qboLines must be the exact label strings from the QBO list above

Return ONLY valid JSON, no explanation:
{
  "fields": [
    {
      "fieldId": "rent",
      "label": "RENT (Monthly: Base + CAM)",
      "cell": "M17",
      "type": "monthly",
      "qboLines": ["Rent"],
      "suggestedValue": 15800,
      "confidence": "high",
      "note": "Direct match to 'Rent' line in QBO"
    }
  ]
}`;

  const msg = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  // Extract JSON from response
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude did not return valid JSON");

  const parsed = JSON.parse(match[0]) as { fields: FieldSuggestion[] };
  return parsed.fields;
}

// ── Excel date serial ─────────────────────────────────────────────────────────
function toExcelDate(year: number, month = 1, day = 1): number {
  const d = new Date(year, month - 1, day);
  const epoch = new Date(1899, 11, 30); // Excel epoch Dec 30, 1899
  return Math.round((d.getTime() - epoch.getTime()) / 86400000);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/bp/analyze
router.post(
  "/bp/analyze",
  upload.fields([{ name: "qboFile", maxCount: 1 }, { name: "capFile", maxCount: 1 }]),
  async (req: Request, res: Response) => {
    try {
      const { storeId } = req.body as { storeId: string };
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;

      if (!files?.qboFile?.[0] || !files?.capFile?.[0]) {
        return void res.status(400).json({ error: "Both qboFile and capFile are required" });
      }

      const capData = parseCap(files.capFile[0].buffer);
      if (!capData) return void res.status(400).json({ error: "Could not parse CAP report — check file format" });

      const qboData = parseQbo(files.qboFile[0].buffer, storeId);
      if (!qboData) return void res.status(400).json({ error: `Store ${STORE_WINMARK[storeId]} not found in QBO file` });

      // Load saved data
      const allHeaders = loadJson(HEADERS_PATH) as Record<string, Record<string, unknown>>;
      const allMappings = loadJson(MAPPINGS_PATH) as Record<string, Record<string, unknown>>;
      const savedHeaders  = allHeaders[storeId]  || {};
      const savedMappings = allMappings[storeId] || {};

      // Compute total sales from QBO for % calculations
      const salesNew  = (qboData["Sales New (4001)"] || qboData["Sales New"]  || 0) as number;
      const salesUsed = (qboData["Sales Used (4002)"] || qboData["Sales Used"] || 0) as number;
      const totalSalesTY = salesNew + salesUsed;

      // Get Claude mapping suggestions
      let fieldSuggestions: FieldSuggestion[] = [];
      const hasApiKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "sk-ant-your-key-here";

      if (hasApiKey) {
        try {
          fieldSuggestions = await getClaudeMappings(qboData, savedMappings, totalSalesTY);
        } catch (e) {
          console.error("Claude mapping error:", e);
          // Fall through with empty suggestions — user fills manually
        }
      }

      // Merge Claude suggestions with fixed values
      const fields = WINMARK_FIELDS.map((wf) => {
        const suggestion = fieldSuggestions.find((s) => s.fieldId === wf.id);
        const fixed = "fixed" in wf ? (wf.fixed as number) : undefined;
        return {
          fieldId: wf.id,
          label:   wf.label,
          cell:    wf.cell,
          type:    wf.type,
          qboLines:       suggestion?.qboLines       || [],
          suggestedValue: fixed ?? suggestion?.suggestedValue ?? 0,
          confidence:     fixed ? "high" : (suggestion?.confidence || (hasApiKey ? "low" : "none")),
          note:           fixed
            ? "Fixed Winmark rate — do not change"
            : (suggestion?.note || (hasApiKey ? "Could not map automatically — please enter manually" : "Add your Anthropic API key for auto-mapping")),
        };
      });

      res.json({ capData, qboData, savedHeaders, fields });
    } catch (err) {
      console.error("bp/analyze error:", err);
      res.status(500).json({ error: String(err) });
    }
  },
);

// GET /api/bp/store-header/:storeId
router.get("/bp/store-header/:storeId", (req: Request, res: Response) => {
  const headers = loadJson(HEADERS_PATH) as Record<string, unknown>;
  res.json(headers[req.params.storeId] || {});
});

// POST /api/bp/store-header/:storeId
router.post("/bp/store-header/:storeId", (req: Request, res: Response) => {
  const headers = loadJson(HEADERS_PATH) as Record<string, Record<string, unknown>>;
  headers[req.params.storeId] = { ...headers[req.params.storeId], ...req.body };
  saveJson(HEADERS_PATH, headers);
  res.json({ ok: true });
});

// POST /api/bp/generate
router.post("/bp/generate", async (req: Request, res: Response) => {
  try {
    const {
      storeId,
      capData,
      planYear,
      salesY1,
      salesY2growthPct,
      usedPct,
      ownerSalary,
      managerSalary,
      hourlyLaborPct,
      cashBalance,
      locBalance,
      inventoryUsed,
      inventoryNew,
      confirmedFields,   // Record<fieldId, number> — confirmed expense values
      storeHeader,
    } = req.body as {
      storeId: string;
      capData: { sales2025: number[]; sales2024: number[] };
      planYear: number;
      salesY1: number;
      salesY2growthPct: number;
      usedPct: number;
      ownerSalary: number;
      managerSalary: number;
      hourlyLaborPct: number;
      cashBalance: number;
      locBalance: number;
      inventoryUsed: number;
      inventoryNew: number;
      confirmedFields: Record<string, number>;
      storeHeader: Record<string, string | number>;
    };

    const winmarkNum = STORE_WINMARK[storeId];

    // Save store header and confirmed field mappings
    const allHeaders = loadJson(HEADERS_PATH) as Record<string, Record<string, unknown>>;
    allHeaders[storeId] = { ...allHeaders[storeId], ...storeHeader };
    saveJson(HEADERS_PATH, allHeaders);

    const allMappings = loadJson(MAPPINGS_PATH) as Record<string, Record<string, unknown>>;
    allMappings[storeId] = { ...allMappings[storeId], ...confirmedFields };
    saveJson(MAPPINGS_PATH, allMappings);

    // Load template with ExcelJS — preserves all styles, formulas, merged cells
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);

    // Helper: set a data-only cell value — skips formula cells, never touches style
    function setVal(sheetName: string, addr: string, value: number | string | Date) {
      const ws = wb.getWorksheet(sheetName);
      if (!ws) return;
      const cell = ws.getCell(addr);
      // Never overwrite a formula cell
      if (cell.formula) return;
      cell.value = value;
    }

    // ── Indices_Margins: update sales index rows ──────────────────────────────
    const MONTHS_COLS = ["C","D","E","F","G","H","I","J","K","L","M","N"];

    // Row 20 = 2025 monthly sales (last full year)
    // Row 22 = 2024 monthly sales (prior year)
    capData.sales2025.forEach((val, i) => setVal("Indices_Margins", MONTHS_COLS[i] + "20", val));
    setVal("Indices_Margins", "B20", planYear - 1);
    capData.sales2024.forEach((val, i) => setVal("Indices_Margins", MONTHS_COLS[i] + "22", val));
    setVal("Indices_Margins", "B22", planYear - 2);

    // ── Input sheet ───────────────────────────────────────────────────────────

    // Store information
    setVal("Input", "C6",  String(storeHeader.franchisee  || ""));
    setVal("Input", "C7",  String(storeHeader.location    || STORE_CITIES[storeId]));
    setVal("Input", "C8",  Number(winmarkNum));
    setVal("Input", "C9",  new Date(planYear, 0, 1)); // Jan 1 of plan year — ExcelJS handles date natively
    setVal("Input", "C10", String(storeHeader.ownerName   || storeHeader.franchisee || ""));

    // Sales assumptions
    setVal("Input", "C14", salesY1);
    setVal("Input", "D15", salesY2growthPct / 100);
    setVal("Input", "D16", salesY2growthPct / 100);
    setVal("Input", "F14", usedPct / 100);
    setVal("Input", "F15", usedPct / 100);
    setVal("Input", "F16", usedPct / 100);

    // Management compensation
    setVal("Input", "C21", ownerSalary);
    setVal("Input", "C22", ownerSalary);
    setVal("Input", "C27", managerSalary);
    setVal("Input", "C28", managerSalary);

    // Hourly labor %
    if (hourlyLaborPct > 0) {
      setVal("Input", "T19", hourlyLaborPct / 100);
      setVal("Input", "V19", hourlyLaborPct / 100);
    }

    // Balance sheet
    setVal("Input", "E33", cashBalance);
    setVal("Input", "C45", locBalance);

    // Inventory profile
    setVal("Input", "P38", inventoryNew);
    setVal("Input", "P40", inventoryUsed);

    // Expense fields from confirmed mappings
    const fieldMap: Record<string, string> = {};
    WINMARK_FIELDS.forEach((f) => { fieldMap[f.id] = f.cell; });

    for (const [fieldId, value] of Object.entries(confirmedFields)) {
      const cell = fieldMap[fieldId];
      if (cell && value !== undefined && value !== null) {
        setVal("Input", cell, Number(value));
      }
    }

    // Return Excel buffer
    const outBuffer = Buffer.from(await wb.xlsx.writeBuffer());

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="BP_${winmarkNum}_${planYear}.xlsx"`);
    res.send(outBuffer);
  } catch (err) {
    console.error("bp/generate error:", err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
