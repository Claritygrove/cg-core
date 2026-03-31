import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, Package, Pencil, Check, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Vendor {
  id: string;
  name: string;
  category: string;
  website: string;
  notes: string;
}

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: "v1",
    name: "Apex Apparel Wholesale",
    category: "New Apparel",
    website: "https://www.apexapparelwholesale.com",
    notes: "Wholesale basics, blanks, and seasonals — good for new-with-tags fill. Ask for the Winmark reseller rate. Min order $300.",
  },
  {
    id: "v2",
    name: "Accessory Collective",
    category: "Accessories",
    website: "https://www.accessorycollective.com",
    notes: "Jewelry, handbags, belts. Strong margins on jewelry. Ask for the Winmark rate sheet.",
  },
  {
    id: "v3",
    name: "Great Lakes Closeouts",
    category: "Liquidation",
    website: "https://www.greatlakescloseouts.com",
    notes: "Regional overstock and closeout lots. Primarily new-with-tags apparel. Good price per unit — sort lots on arrival. No returns.",
  },
  {
    id: "v4",
    name: "StyleWholesale Co.",
    category: "New Apparel",
    website: "https://www.stylewholesale.com",
    notes: "New-with-tags basics and basics. Works well for Style Encore. Lead time 2–3 weeks.",
  },
  {
    id: "v5",
    name: "Midwest Liquidators",
    category: "Liquidation",
    website: "https://www.midwestliquidators.com",
    notes: "Regional liquidation lots — hit or miss but great price per unit. Best for Portage and Ann Arbor volume.",
  },
];

// ─── Read-only card ────────────────────────────────────────────────────────────

function VendorCard({ vendor }: { vendor: Vendor }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="hover:border-primary/30 transition-colors duration-200">
      <CardHeader className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-snug">{vendor.name}</CardTitle>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">{vendor.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors px-2.5 py-1.5 rounded-md bg-primary/8 hover:bg-primary/15"
            >
              <ExternalLink className="h-3 w-3" />
              Website
            </a>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="px-5 pb-5">
          <div className="border-t border-border/50 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-2">Notes</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{vendor.notes}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Editable card ─────────────────────────────────────────────────────────────

function VendorEditCard({
  vendor,
  onChange,
  onDelete,
}: {
  vendor: Vendor;
  onChange: (updated: Vendor) => void;
  onDelete: () => void;
}) {
  const inputCls = "w-full px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/70 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors";

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={vendor.name}
                  onChange={(e) => onChange({ ...vendor, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-1">Category</label>
                <input
                  type="text"
                  value={vendor.category}
                  onChange={(e) => onChange({ ...vendor, category: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-1">Website</label>
              <input
                type="text"
                value={vendor.website}
                onChange={(e) => onChange({ ...vendor, website: e.target.value })}
                className={inputCls}
                placeholder="https://"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-1">Notes</label>
              <textarea
                value={vendor.notes}
                onChange={(e) => onChange({ ...vendor, notes: e.target.value })}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 mt-0.5"
            title="Remove vendor"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NewProductVendors() {
  const [vendors, setVendors] = useState<Vendor[]>(() =>
    JSON.parse(JSON.stringify(DEFAULT_VENDORS))
  );
  const [editMode, setEditMode] = useState(false);

  function handleChange(id: string, updated: Vendor) {
    setVendors((prev) => prev.map((v) => (v.id === id ? updated : v)));
  }

  function handleDelete(id: string) {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  }

  function handleAdd() {
    setVendors((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "New Vendor", category: "", website: "https://", notes: "" },
    ]);
  }

  function handleDone() {
    // Remove any blank vendors
    setVendors((prev) => prev.filter((v) => v.name.trim()));
    setEditMode(false);
  }

  function handleCancel() {
    setVendors(JSON.parse(JSON.stringify(DEFAULT_VENDORS)));
    setEditMode(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Approved New Product Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Vendors approved for new product purchases across Eagle V stores.
          </p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border/60 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/60 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Done
            </button>
          </div>
        )}
      </div>

      {/* Vendor list */}
      <div className="space-y-3">
        {editMode ? (
          <>
            {vendors.map((vendor) => (
              <VendorEditCard
                key={vendor.id}
                vendor={vendor}
                onChange={(updated) => handleChange(vendor.id, updated)}
                onDelete={() => handleDelete(vendor.id)}
              />
            ))}
            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/60 text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Vendor
            </button>
          </>
        ) : (
          vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))
        )}
      </div>
    </div>
  );
}
