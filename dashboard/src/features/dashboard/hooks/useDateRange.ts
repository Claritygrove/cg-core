import { useState, useMemo } from "react";
import { getPresetRange } from "../utils/datePresets";
import type { PresetKey } from "../types";

export function useDateRange() {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("last-week");
  const [customStart, setCustomStart] = useState(""); // YYYY-MM-DD
  const [customEnd, setCustomEnd] = useState("");     // YYYY-MM-DD

  const activeRange = useMemo(() => {
    if (selectedPreset === "custom") {
      return customStart && customEnd ? { start: customStart, end: customEnd } : null;
    }
    return getPresetRange(selectedPreset);
  }, [selectedPreset, customStart, customEnd]);

  return {
    selectedPreset,
    setSelectedPreset,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    activeRange,
  };
}
