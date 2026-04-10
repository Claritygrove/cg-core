import type { PresetKey } from "../types";

export function getPresetRange(preset: PresetKey): { start: string; end: string } | null {
  const today = new Date();
  const pad = (d: Date) => d.toISOString().split("T")[0]!;
  const daysFromMonday = (today.getDay() + 6) % 7;

  if (preset === "last-month") {
    const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastOfLastMonth = new Date(firstOfThisMonth.getTime() - 1);
    const firstOfLastMonth = new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1);
    return { start: pad(firstOfLastMonth), end: pad(lastOfLastMonth) };
  }
  if (preset === "ytd") {
    return { start: pad(new Date(today.getFullYear(), 0, 1)), end: pad(today) };
  }
  if (preset === "last-week") {
    const s = new Date(today); s.setDate(today.getDate() - daysFromMonday - 7);
    const e = new Date(today); e.setDate(today.getDate() - daysFromMonday - 1);
    return { start: pad(s), end: pad(e) };
  }
  return null;
}

export const PRESET_LABELS: Record<PresetKey, string> = {
  "last-week":  "Last Week",
  "last-month": "Last Month",
  "ytd":        "Year to Date",
  "custom":     "Custom Range",
};

export const PRESET_ORDER: PresetKey[] = ["last-week", "last-month", "ytd", "custom"];

/** YYYY-MM-DD → MM/DD/YYYY for display */
export function toDisplayDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length < 10) return "";
  const [y, m, d] = yyyymmdd.split("-");
  return `${m}/${d}/${y}`;
}

/** MM/DD/YYYY → YYYY-MM-DD for API. Returns "" if incomplete/invalid. */
export function toApiDate(mmddyyyy: string): string {
  if (!mmddyyyy || mmddyyyy.length < 10) return "";
  const parts = mmddyyyy.split("/");
  if (parts.length !== 3) return "";
  const [m, d, y] = parts;
  if (!y || y.length < 4) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}
