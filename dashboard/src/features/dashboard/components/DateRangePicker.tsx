import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import type { DateRange as DayRange } from "react-day-picker";
import { IMaskInput } from "react-imask";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PRESET_LABELS, PRESET_ORDER, toDisplayDate, toApiDate } from "../utils/datePresets";
import type { PresetKey } from "../types";

interface DateRangePickerProps {
  selectedPreset: PresetKey;
  customStart: string;   // YYYY-MM-DD or ""
  customEnd: string;     // YYYY-MM-DD or ""
  activeRange: { start: string; end: string } | null;
  dateRangeLabel?: string;
  onPresetChange: (p: PresetKey) => void;
  onCustomApply: (start: string, end: string) => void;
}

function parseYMD(yyyymmdd: string): Date | undefined {
  if (!yyyymmdd || yyyymmdd.length < 10) return undefined;
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? undefined : date;
}

function dateToYMD(date: Date | undefined): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Dark-mode Tailwind classNames for react-day-picker
const rdp: Record<string, string> = {
  months:               "flex flex-col",
  month:                "space-y-2",
  caption:              "flex justify-center pt-1 relative items-center h-8",
  caption_label:        "text-[13px] font-semibold text-foreground",
  nav:                  "flex items-center gap-1",
  nav_button:           "h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
  nav_button_previous:  "absolute left-0",
  nav_button_next:      "absolute right-0",
  table:                "w-full border-collapse",
  head_row:             "flex",
  head_cell:            "text-muted-foreground w-8 text-center text-[11px] font-medium pb-1",
  row:                  "flex w-full mt-0.5",
  cell:                 "w-8 h-8 text-center text-[12px] p-0 relative [&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
  day:                  "h-8 w-8 p-0 font-normal rounded-md flex items-center justify-center hover:bg-muted transition-colors aria-selected:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
  day_selected:         "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md",
  day_today:            "text-primary font-semibold",
  day_outside:          "text-muted-foreground/30",
  day_disabled:         "text-muted-foreground/25 cursor-not-allowed",
  day_range_middle:     "aria-selected:bg-primary/10 aria-selected:text-foreground rounded-none",
  day_range_start:      "bg-primary text-primary-foreground rounded-md",
  day_range_end:        "bg-primary text-primary-foreground rounded-md",
  day_hidden:           "invisible",
};

export function DateRangePicker({
  selectedPreset,
  customStart,
  customEnd,
  activeRange,
  dateRangeLabel,
  onPresetChange,
  onCustomApply,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // Local draft state for custom range — only applied on "Apply"
  const [draftStart, setDraftStart] = useState(customStart);
  const [draftEnd, setDraftEnd] = useState(customEnd);
  const ref = useRef<HTMLDivElement>(null);

  // Keep draft in sync when parent resets custom
  useEffect(() => { setDraftStart(customStart); }, [customStart]);
  useEffect(() => { setDraftEnd(customEnd); }, [customEnd]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleCalendarSelect(range: DayRange | undefined) {
    if (!range) return;
    setDraftStart(dateToYMD(range.from));
    setDraftEnd(dateToYMD(range.to));
  }

  function handleMaskedAccept(value: string, field: "start" | "end") {
    // Reject incomplete masks (imask fills missing chars with '_')
    if (value.includes("_") || value.length < 10) return;
    const api = toApiDate(value);
    if (!api) return;
    if (field === "start") setDraftStart(api);
    else setDraftEnd(api);
  }

  const canApply = draftStart.length === 10 && draftEnd.length === 10 && draftStart <= draftEnd;

  function handleApply() {
    onCustomApply(draftStart, draftEnd);
    setOpen(false);
  }

  // Build the button label
  let buttonLabel: string;
  if (selectedPreset === "custom" && customStart && customEnd) {
    buttonLabel = `${toDisplayDate(customStart)} – ${toDisplayDate(customEnd)}`;
  } else {
    buttonLabel = dateRangeLabel ?? PRESET_LABELS[selectedPreset];
  }

  const calendarRange: DayRange = {
    from: parseYMD(draftStart),
    to:   parseYMD(draftEnd),
  };

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/70 bg-card hover:border-border hover:bg-muted/30 transition-all text-sm font-medium text-foreground/80 hover:text-foreground"
      >
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{buttonLabel}</span>
        <span className="text-muted-foreground/40 text-xs">·</span>
        <span className="text-muted-foreground text-xs">7 stores</span>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground ml-0.5 transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-10 z-50 bg-card border border-border rounded-xl shadow-2xl shadow-black/30 p-3 w-72"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Date Range
            </p>

            {/* Preset buttons */}
            <div className="space-y-0.5">
              {PRESET_ORDER.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onPresetChange(p);
                    if (p !== "custom") setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedPreset === p
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {PRESET_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Custom date inputs + calendar */}
            {selectedPreset === "custom" && (
              <div className="mt-3 pt-3 border-t border-border space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                    <IMaskInput
                      mask="00/00/0000"
                      placeholder="MM/DD/YYYY"
                      value={toDisplayDate(draftStart)}
                      onAccept={(val) => handleMaskedAccept(val as string, "start")}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End</label>
                    <IMaskInput
                      mask="00/00/0000"
                      placeholder="MM/DD/YYYY"
                      value={toDisplayDate(draftEnd)}
                      onAccept={(val) => handleMaskedAccept(val as string, "end")}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Calendar */}
                <div className="flex justify-center">
                  <DayPicker
                    mode="range"
                    selected={calendarRange}
                    onSelect={handleCalendarSelect}
                    classNames={rdp}
                    components={{
                      IconLeft: () => <ChevronLeft className="h-3.5 w-3.5" />,
                      IconRight: () => <ChevronRight className="h-3.5 w-3.5" />,
                    }}
                  />
                </div>

                {canApply && (
                  <button
                    onClick={handleApply}
                    className="w-full px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Apply
                  </button>
                )}
                {!canApply && draftStart && draftEnd && draftStart > draftEnd && (
                  <p className="text-xs text-rose-400 text-center">End date must be after start date</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
