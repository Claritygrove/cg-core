import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx") as typeof import("xlsx");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUTS_DIR = path.resolve(__dirname, "../01-inputs");

// Maps store names from WIW to our store IDs
const STORE_NAME_MAP: Record<string, string> = {
  "PC Portage":     "pc-80237",
  "SE Portage":     "se-60039",
  "PC East Lansing":"pc-80185",
  "PC Jackson":     "pc-80634",
  "PC Ann Arbor":   "pc-80726",
  "PC Canton":      "pc-80783",
  "PC Novi":        "pc-80877",
};

// Maps Winmark store number to our store ID
const STORE_NUMBER_MAP: Record<string, string> = {
  "80237": "pc-80237",
  "60039": "se-60039",
  "80185": "pc-80185",
  "80634": "pc-80634",
  "80726": "pc-80726",
  "80783": "pc-80783",
  "80877": "pc-80877",
};

export interface StoreFileData {
  storeId: string;
  weekLabel?: string;
  // Sales
  weekSales?: number;
  weekSalesLY?: number;
  weekTransactions?: number;      // shopper count
  weekTransactionsLY?: number;
  weekAvgRetail?: number;
  weekAvgRetailLY?: number;
  weekItemsPerSale?: number;
  weekItemsPerSaleLY?: number;
  weekSellMargin?: number;        // e.g. 63.1 (displayed as 63.1%)
  weekSellMarginLY?: number;
  projAnnualSales?: number;       // Projected annual sales from store visit report header
  // Buys
  weekTotalBuys?: number;
  weekTotalBuysLY?: number;
  weekSellerCount?: number;
  weekSellerCountLY?: number;
  weekItemsPerBuy?: number;
  weekItemsPerBuyLY?: number;
  // Labor (from WIW XLSX)
  scheduledHours?: number;
}

// Parse a Winmark "Store Visit" CSV for one store
function parseWinmarkCSV(content: string): StoreFileData | null {
  const lines = content.split("\n").map((l) => l.trim());

  // Line 1 (index 1) has the store number in field 0 and proj annual sales in field 6
  const storeHeaderLine = lines[1];
  if (!storeHeaderLine) return null;

  const storeHeaderFields = parseCSVRow(storeHeaderLine);
  const firstField = storeHeaderFields[0]?.replace(/"/g, "").trim();
  if (!firstField) return null;
  const storeId = STORE_NUMBER_MAP[firstField];
  if (!storeId) return null;

  // Find the Sales header row
  const salesHeaderIdx = lines.findIndex((l) => l.startsWith("Sales_TYLbl"));
  if (salesHeaderIdx === -1) return null;

  const salesHeaders = parseCSVRow(lines[salesHeaderIdx]);
  const salesData    = parseCSVRow(lines[salesHeaderIdx + 1] ?? "");

  const parseDollar  = (s: string) => parseFloat(s.replace(/[$,]/g, "")) || 0;
  const parseInt2    = (s: string) => parseInt(s.replace(/,/g, ""), 10) || 0;
  // Parses "63.1%" → 63.1 and "0.631" → 63.1
  const parsePct     = (s: string) => {
    const n = parseFloat(s.replace(/[%$,]/g, "").trim());
    if (isNaN(n)) return 0;
    return Math.abs(n) < 1.5 ? n * 100 : n;
  };

  const getSales = (key: string) => salesData[salesHeaders.indexOf(key)] ?? "";

  // Column 6 of the store header line = Projected Annual Sales
  const projAnnualSales = parseDollar(storeHeaderFields[6] ?? "");

  const weekLabel         = getSales("Sales_TYLbl");
  const weekSales         = parseDollar(getSales("Sales_YTDTY"));
  const weekSalesLY       = parseDollar(getSales("Sales_YTDLY"));
  const weekTransactions  = parseInt2(getSales("Sales_TrxCountYTDTY"));
  const weekTransactionsLY= parseInt2(getSales("Sales_TrxCountYTDLY"));
  const weekAvgRetail     = parseDollar(getSales("Sales_AvgTrxTY"));
  const weekAvgRetailLY   = parseDollar(getSales("Sales_AvgTrxLY"));
  const weekItemsPerSale  = parseFloat(getSales("Sales_AvgItemsTY")) || 0;
  const weekItemsPerSaleLY= parseFloat(getSales("Sales_AvgItemsLY")) || 0;
  const weekSellMargin    = parsePct(getSales("Sales_GMPctYTDTY"));
  const weekSellMarginLY  = parsePct(getSales("Sales_GMPctYTDLY"));

  // Find the Buys header row
  const buysHeaderIdx = lines.findIndex((l) => l.startsWith("Buys_TYLbl"));
  let weekTotalBuys = 0, weekTotalBuysLY = 0;
  let weekSellerCount = 0, weekSellerCountLY = 0;
  let weekItemsPerBuy = 0, weekItemsPerBuyLY = 0;

  if (buysHeaderIdx !== -1) {
    const buysHeaders = parseCSVRow(lines[buysHeaderIdx]);
    const buysData    = parseCSVRow(lines[buysHeaderIdx + 1] ?? "");
    const getBuys = (key: string) => buysData[buysHeaders.indexOf(key)] ?? "";

    weekTotalBuys    = parseDollar(getBuys("Buys_YTDTY"));
    weekTotalBuysLY  = parseDollar(getBuys("Buys_YTDLY"));
    weekSellerCount  = parseInt2(getBuys("Buys_CountTY"));
    weekSellerCountLY= parseInt2(getBuys("Buys_CountLY"));
    weekItemsPerBuy  = parseFloat(getBuys("Buys_AvgItemsTY")) || 0;
    weekItemsPerBuyLY= parseFloat(getBuys("Buys_AvgItemsLY")) || 0;
  }

  return {
    storeId, weekLabel,
    weekSales, weekSalesLY,
    weekTransactions, weekTransactionsLY,
    weekAvgRetail, weekAvgRetailLY,
    weekItemsPerSale, weekItemsPerSaleLY,
    weekSellMargin, weekSellMarginLY,
    projAnnualSales: projAnnualSales > 0 ? projAnnualSales : undefined,
    weekTotalBuys, weekTotalBuysLY,
    weekSellerCount, weekSellerCountLY,
    weekItemsPerBuy, weekItemsPerBuyLY,
  };
}

// Parse a When I Work XLSX and return scheduled hours per store
async function parseWIWXLSX(filePath: string): Promise<Record<string, number>> {
  const workbook = XLSX.readFile(filePath);

  const hoursByStore: Record<string, number> = {};

  for (const sheetName of workbook.SheetNames) {
    if (!sheetName.startsWith("Hourly - ")) continue;
    const storeName = sheetName.replace("Hourly - ", "").trim();
    const storeId = STORE_NAME_MAP[storeName];
    if (!storeId) continue;

    const sheet = workbook.Sheets[sheetName]!;
    // Use header row as object keys, skip rows where store name is missing
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

    let totalHours = 0;
    for (const row of rows) {
      // Each row has a "Total Hours" column — use that if present and numeric
      const totalHoursVal = row["Total Hours"];
      if (typeof totalHoursVal === "number" && totalHoursVal > 0 && totalHoursVal < 100) {
        totalHours += totalHoursVal;
      }
    }

    // If Total Hours column was empty, fall back to summing day columns
    if (totalHours === 0) {
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: 0 });
      const headers = rawRows[0] as string[];
      // Find columns that look like day headers (numeric date or string with month name)
      const dayCols = headers.reduce<number[]>((acc, h, i) => {
        if (typeof h === "string" && /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(h)) acc.push(i);
        return acc;
      }, []);
      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i] as (string | number)[];
        for (const col of dayCols) {
          const val = parseFloat(String(row[col] ?? 0));
          if (!isNaN(val) && val > 0 && val < 24) totalHours += val;
        }
      }
    }

    console.log(`WIW ${storeName}: ${totalHours.toFixed(1)} scheduled hours`);
    hoursByStore[storeId] = (hoursByStore[storeId] ?? 0) + totalHours;
  }

  return hoursByStore;
}

// Simple CSV row parser that handles quoted fields
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

// Read all files in 01-inputs/ and merge into a map of storeId -> data
export async function readInputFiles(): Promise<Map<string, StoreFileData>> {
  const merged = new Map<string, StoreFileData>();

  let files: string[];
  try {
    files = await fs.readdir(INPUTS_DIR);
  } catch {
    console.log("01-inputs/ directory not found or empty");
    return merged;
  }

  // Process Winmark CSVs first
  for (const file of files) {
    if (!file.toLowerCase().endsWith(".csv")) continue;
    const filePath = path.join(INPUTS_DIR, file);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const data = parseWinmarkCSV(content);
      if (data) {
        merged.set(data.storeId, { ...merged.get(data.storeId), ...data });
        console.log(`Loaded Winmark CSV for ${data.storeId} (${file})`);
      }
    } catch (e) {
      console.error(`Error reading ${file}:`, e);
    }
  }

  // Process WIW XLSX files
  for (const file of files) {
    if (!file.toLowerCase().endsWith(".xlsx")) continue;
    const filePath = path.join(INPUTS_DIR, file);
    try {
      const hoursByStore = await parseWIWXLSX(filePath);
      for (const [storeId, hours] of Object.entries(hoursByStore)) {
        const existing = merged.get(storeId) ?? { storeId };
        merged.set(storeId, { ...existing, scheduledHours: hours });
        console.log(`Loaded WIW hours for ${storeId}: ${hours.toFixed(1)}h`);
      }
    } catch (e) {
      console.error(`Error reading XLSX ${file}:`, e);
    }
  }

  return merged;
}
