import { ChevronDown } from "lucide-react";
import { FLOOR_PLAN_STORES } from "../data/storeDefaults";

interface StoreSelectorProps {
  value: string;
  onChange: (storeId: string) => void;
  disabled?: boolean;
}

export function StoreSelector({ value, onChange, disabled }: StoreSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none text-[12px] font-medium bg-muted/50 border border-border/50 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
      >
        {FLOOR_PLAN_STORES.map((store) => (
          <option key={store.storeId} value={store.storeId}>
            {store.displayName}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
    </div>
  );
}
