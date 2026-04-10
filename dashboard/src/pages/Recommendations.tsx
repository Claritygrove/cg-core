import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  MapPin,
  Phone,
  Hash,
  ChevronLeft,
  Wrench,
  Eye,
  EyeOff,
  Key,
  Wifi,
  Router,
  Monitor,
  LayoutGrid,
  CreditCard,
  PhoneCall,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Server,
  Layers,
  NotebookPen,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Store {
  id: string;
  name: string;
  type: string;
  location: string;
  externalId: string;
}

interface StoresResponse {
  stores: Store[];
}

// ─── Static store data ────────────────────────────────────────────────────────

const STORE_PHONES: Record<string, string> = {
  "pc-80237": "269-327-6622",
  "se-60039": "269-459-6655",
  "pc-80185": "517-332-6622",
  "pc-80634": "517-998-6622",
  "pc-80726": "734-769-8500",
  "pc-80783": "734-459-5029",
  "pc-80877": "248-374-8075",
};

interface BACredentials {
  username: string;
  password: string;
}

const BRAND_ADVANTAGE: Record<string, BACredentials> = {
  "pc-80237": { username: "placeholder", password: "placeholder" },
  "se-60039": { username: "placeholder", password: "placeholder" },
  "pc-80185": { username: "placeholder", password: "placeholder" },
  "pc-80634": { username: "placeholder", password: "placeholder" },
  "pc-80726": { username: "placeholder", password: "placeholder" },
  "pc-80783": { username: "placeholder", password: "placeholder" },
  "pc-80877": { username: "placeholder", password: "placeholder" },
};

interface WifiConfig {
  ssid24: string;
  ssid5: string;
  password: string;
  routerBrand: string;
  routerModel: string;
  routerMode: string;
  routerAdminIp: string;
  routerAdminPassword: string;
  adminAccessNote?: string;
}

interface DeviceLocation {
  area: string;
  devices: string[];
}

interface StoreNetwork {
  wifi: WifiConfig | null;
  merchantId: string;  // Chase Merchant ID
  deviceLocations: DeviceLocation[];
}

const NETWORK_INFO: Record<string, StoreNetwork> = {
  "pc-80237": {
    merchantId: "5932783",
    wifi: {
      ssid24: "PC Portage",
      ssid5: "PC Portage 5G",
      password: "2693276622",
      routerBrand: "Netgear",
      routerModel: "R6400v2 (AC1750 Dual Band)",
      routerMode: "Access Point (AP) mode — SonicWall handles routing & DHCP",
      routerAdminIp: "192.168.50.10",
      routerAdminPassword: "Eaglev$2222",
      adminAccessNote: "Direct Ethernet required to access admin: unplug SonicWall from router, plug laptop into a yellow LAN port, set laptop IP to 192.168.50.20 / subnet 255.255.255.0, then navigate to http://192.168.50.10.",
    },
    deviceLocations: [],
  },
  "se-60039": {
    merchantId: "—",
    wifi: {
      ssid24: "—",
      ssid5: "—",
      password: "—",
      routerBrand: "ASUS",
      routerModel: "RT-AX92U (Tri-Band)",
      routerMode: "Main store Wi-Fi router — backhauled from SonicWall via Netgear GS605",
      routerAdminIp: "—",
      routerAdminPassword: "—",
    },
    deviceLocations: [
      {
        area: "Back Room — JBM Automation Tower rack",
        devices: [
          "123 Net Entry Board",
          "ASUS RT-AX92U Router",
          "Crown 1160MA Stereo Amp",
          "Cloud Cover Media Player (behind amp)",
          "Security DVR & Monitor (on top of rack)",
          "ADT Router (shelf above rack)",
          "Netgear GS605 White Switch (shelf above rack — receives backhaul from SonicWall)",
        ],
      },
      {
        area: "Front — Register 1 (Buy Counter)",
        devices: [
          "POS Terminal",
          "DRS Server",
          "SonicWall SOHO Firewall — #3, pink sticker",
          "Unmanaged Netgear Switch",
          "YeaLink Phone Base",
          "Two YeaLink Handsets (shelf above)",
          "Two Tag Printers",
        ],
      },
      {
        area: "Front — Register 2 (Sales Counter)",
        devices: ["White Netgear Switch", "Legacy CDE Switch (general use)"],
      },
      {
        area: "Front — Register 4 (Far End Sales Counter)",
        devices: ["Netgear GS108 Switch"],
      },
    ],
  },
  "pc-80185": { merchantId: "5932782", wifi: null, deviceLocations: [] },
  "pc-80634": { merchantId: "—",       wifi: null, deviceLocations: [] },
  "pc-80726": { merchantId: "—",       wifi: null, deviceLocations: [] },
  "pc-80783": { merchantId: "—",       wifi: null, deviceLocations: [] },
  "pc-80877": { merchantId: "—",       wifi: null, deviceLocations: [] },
};

// ─── Global network constants ─────────────────────────────────────────────────

const WINMARK_SUPPORT = { phone: "800-752-9212", email: "supportcenter@winmarkcorporation.com" };
const CHASE_SUPPORT   = { phone: "888-886-8869", companyNumber: "1529636" };
const CC_TERMINAL     = "Ingenico Lane/5000";

// ─── Store Notes ──────────────────────────────────────────────────────────────

function StoreNotesBlock({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  const { data } = useQuery<{ notes: string[] }>({
    queryKey: ["store-notes", storeId],
    queryFn: () => fetch(`/api/stores/${storeId}/notes`).then((r) => r.json()),
  });

  const notes = data?.notes ?? [];

  const save = useMutation({
    mutationFn: (updated: string[]) =>
      fetch(`/api/stores/${storeId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updated }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store-notes", storeId] }),
  });

  function addNote() {
    const text = draft.trim();
    if (!text) return;
    save.mutate([...notes, text]);
    setDraft("");
    textRef.current?.focus();
  }

  function deleteNote(i: number) {
    save.mutate(notes.filter((_, idx) => idx !== i));
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote();
  }

  return (
    <Card>
      <CardHeader className="pb-0 border-b border-border/60">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 pb-4">
          <div className="p-1.5 bg-muted rounded-md shrink-0">
            <NotebookPen className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          Manager Notes
          <span className="ml-auto text-[10px] font-normal text-muted-foreground">⌘↵ to save</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {/* Existing notes */}
        {notes.length > 0 && (
          <div className="space-y-2">
            {notes.map((note, i) => (
              <div key={i} className="group flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/30">
                <p className="flex-1 text-[12px] text-foreground/85 leading-relaxed whitespace-pre-wrap">{note}</p>
                <button
                  onClick={() => deleteNote(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                  title="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New note input */}
        <div className="flex gap-2">
          <textarea
            ref={textRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Add a note — inventory levels, staffing changes, floorset observations..."
            rows={3}
            className="flex-1 resize-none text-[12px] rounded-lg bg-muted/30 border border-border/40 px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed"
          />
          <button
            onClick={addNote}
            disabled={!draft.trim() || save.isPending}
            className="self-end flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[12px] font-medium shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Overhead floorset SVG ────────────────────────────────────────────────────

function FloorsetDiagram() {
  return (
    <svg
      viewBox="0 0 520 340"
      className="w-full max-w-2xl mx-auto rounded-lg"
      style={{ background: "hsl(222 20% 6%)" }}
      aria-label="Overhead sales floor layout example"
    >
      {/* Outer walls */}
      <rect x="10" y="10" width="500" height="320" rx="4" fill="none" stroke="hsl(222 18% 22%)" strokeWidth="2" />

      {/* Entrance */}
      <rect x="215" y="308" width="90" height="22" rx="2" fill="hsl(222 20% 6%)" />
      <line x1="215" y1="310" x2="215" y2="330" stroke="hsl(221 79% 56%)" strokeWidth="1.5" />
      <line x1="305" y1="310" x2="305" y2="330" stroke="hsl(221 79% 56%)" strokeWidth="1.5" />
      <text x="260" y="323" textAnchor="middle" fill="hsl(221 79% 56%)" fontSize="9" fontFamily="system-ui" fontWeight="600">ENTRANCE</text>

      {/* Checkout counter */}
      <rect x="30" y="258" width="100" height="38" rx="3" fill="hsl(222 18% 12%)" stroke="hsl(221 79% 56% / 0.4)" strokeWidth="1" />
      <text x="80" y="276" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">CHECKOUT</text>
      <text x="80" y="288" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">POS · Bag station</text>

      {/* Buy counter */}
      <rect x="390" y="258" width="100" height="38" rx="3" fill="hsl(222 18% 12%)" stroke="hsl(221 79% 56% / 0.4)" strokeWidth="1" />
      <text x="440" y="276" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">BUY COUNTER</text>
      <text x="440" y="288" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">Drop-off · Eval</text>

      {/* Dressing rooms */}
      <rect x="390" y="20" width="100" height="80" rx="3" fill="hsl(222 18% 11%)" stroke="hsl(222 18% 20%)" strokeWidth="1" />
      <text x="440" y="57" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="8" fontFamily="system-ui" fontWeight="600">DRESSING</text>
      <text x="440" y="68" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="8" fontFamily="system-ui">ROOMS</text>

      {/* Rack section helper */}
      {/* Women's tops */}
      <rect x="30" y="20" width="100" height="50" rx="3" fill="hsl(221 79% 56% / 0.08)" stroke="hsl(221 79% 56% / 0.25)" strokeWidth="1" strokeDasharray="4 2" />
      <text x="80" y="42" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">Women's Tops</text>
      <text x="80" y="53" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">3 racks</text>

      {/* Women's bottoms */}
      <rect x="145" y="20" width="100" height="50" rx="3" fill="hsl(221 79% 56% / 0.08)" stroke="hsl(221 79% 56% / 0.25)" strokeWidth="1" strokeDasharray="4 2" />
      <text x="195" y="42" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">Women's Bottoms</text>
      <text x="195" y="53" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">3 racks</text>

      {/* Dresses / outerwear */}
      <rect x="260" y="20" width="115" height="50" rx="3" fill="hsl(221 79% 56% / 0.08)" stroke="hsl(221 79% 56% / 0.25)" strokeWidth="1" strokeDasharray="4 2" />
      <text x="317" y="42" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">Dresses / Outerwear</text>
      <text x="317" y="53" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">2 racks</text>

      {/* Men's */}
      <rect x="30" y="85" width="130" height="50" rx="3" fill="hsl(221 79% 56% / 0.08)" stroke="hsl(221 79% 56% / 0.25)" strokeWidth="1" strokeDasharray="4 2" />
      <text x="95" y="107" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">Men's</text>
      <text x="95" y="118" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">Tops · Bottoms · 4 racks</text>

      {/* Juniors */}
      <rect x="175" y="85" width="115" height="50" rx="3" fill="hsl(221 79% 56% / 0.08)" stroke="hsl(221 79% 56% / 0.25)" strokeWidth="1" strokeDasharray="4 2" />
      <text x="232" y="107" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">Juniors</text>
      <text x="232" y="118" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">3 racks</text>

      {/* Shoes */}
      <rect x="305" y="85" width="75" height="50" rx="3" fill="hsl(221 79% 56% / 0.08)" stroke="hsl(221 79% 56% / 0.25)" strokeWidth="1" strokeDasharray="4 2" />
      <text x="342" y="107" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">Shoes</text>
      <text x="342" y="118" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">Wall shelves</text>

      {/* Accessories */}
      <rect x="30" y="150" width="130" height="45" rx="3" fill="hsl(221 79% 56% / 0.08)" stroke="hsl(221 79% 56% / 0.25)" strokeWidth="1" strokeDasharray="4 2" />
      <text x="95" y="170" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">Accessories</text>
      <text x="95" y="181" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">Bags · Jewelry · Belts</text>

      {/* New Product */}
      <rect x="175" y="150" width="115" height="45" rx="3" fill="hsl(221 79% 56% / 0.08)" stroke="hsl(221 79% 56% / 0.25)" strokeWidth="1" strokeDasharray="4 2" />
      <text x="232" y="170" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">New Product</text>
      <text x="232" y="181" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">End caps</text>

      {/* Sale racks */}
      <rect x="305" y="150" width="185" height="45" rx="3" fill="hsl(221 79% 56% / 0.08)" stroke="hsl(221 79% 56% / 0.25)" strokeWidth="1" strokeDasharray="4 2" />
      <text x="397" y="170" textAnchor="middle" fill="hsl(214 18% 80%)" fontSize="8" fontFamily="system-ui" fontWeight="600">Sale Racks</text>
      <text x="397" y="181" textAnchor="middle" fill="hsl(218 12% 54%)" fontSize="7" fontFamily="system-ui">Clearance · $5 · $10</text>

      {/* Hallway / traffic flow arrows */}
      <line x1="260" y1="295" x2="260" y2="215" stroke="hsl(221 79% 56% / 0.2)" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#arrow)" />

      {/* Legend */}
      <rect x="30" y="212" width="8" height="8" rx="1" fill="hsl(221 79% 56% / 0.08)" stroke="hsl(221 79% 56% / 0.25)" strokeWidth="1" strokeDasharray="3 2" />
      <text x="44" y="220" fill="hsl(218 12% 54%)" fontSize="7.5" fontFamily="system-ui">Floor section</text>
      <rect x="130" y="212" width="8" height="8" rx="1" fill="hsl(222 18% 12%)" stroke="hsl(221 79% 56% / 0.4)" strokeWidth="1" />
      <text x="144" y="220" fill="hsl(218 12% 54%)" fontSize="7.5" fontFamily="system-ui">Counter / fixture</text>

      <text x="260" y="210" textAnchor="middle" fill="hsl(218 12% 40%)" fontSize="7" fontFamily="system-ui" fontStyle="italic">Example layout — not to scale</text>
    </svg>
  );
}

// ─── Brand Advantage block ────────────────────────────────────────────────────

function BrandAdvantageBlock({ storeId }: { storeId: string }) {
  const [showPass, setShowPass] = useState(false);
  const creds = BRAND_ADVANTAGE[storeId];
  if (!creds) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 bg-muted rounded-md shrink-0">
            <Key className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          Brand Advantage Login
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground w-20 shrink-0">Username</span>
          <span className="font-mono bg-muted/50 px-2 py-1 rounded text-xs">{creds.username}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground w-20 shrink-0">Password</span>
          <div className="flex items-center gap-2">
            <span className="font-mono bg-muted/50 px-2 py-1 rounded text-xs">
              {showPass ? creds.password : "••••••••••"}
            </span>
            <button
              onClick={() => setShowPass((p) => !p)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={showPass ? "Hide" : "Show"}
            >
              {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <div className="pt-2 border-t border-border/50">
          <a
            href="https://brandadvantage.winmark.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            brandadvantage.winmark.com ↗
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Network Information block ────────────────────────────────────────────────

function MaskedField({ value, label }: { value: string; label: string }) {
  const [show, setShow] = useState(false);
  const unknown = value === "—";
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono bg-muted/50 px-2 py-1 rounded text-xs text-foreground">
        {unknown ? "—" : show ? value : "••••••••••"}
      </span>
      {!unknown && (
        <button onClick={() => setShow((p) => !p)} className="text-muted-foreground hover:text-foreground transition-colors" title={show ? `Hide ${label}` : `Show ${label}`}>
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <span className="text-[11px] text-muted-foreground w-28 shrink-0 mt-0.5">{label}</span>
      <div className="flex-1 text-[12px] font-medium text-foreground/90">{children}</div>
    </div>
  );
}

function NetworkInfoBlock({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const net = NETWORK_INFO[storeId];
  if (!net) return null;

  return (
    <Card>
      <CardHeader className="pb-0 border-b border-border/60">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 pb-4">
          <div className="p-1.5 bg-muted rounded-md shrink-0">
            <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          Network Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">

          {/* ── WiFi & Router ── */}
          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3 flex items-center gap-1.5">
              <Wifi className="h-3 w-3" /> WiFi & Router
            </p>
            {net.wifi ? (
              <div>
                <InfoRow icon={<Wifi className="h-3.5 w-3.5" />} label="2.4 GHz SSID">
                  <span className="font-mono">{net.wifi.ssid24}</span>
                </InfoRow>
                <InfoRow icon={<Wifi className="h-3.5 w-3.5" />} label="5 GHz SSID">
                  <span className="font-mono">{net.wifi.ssid5}</span>
                </InfoRow>
                <InfoRow icon={<Key className="h-3.5 w-3.5" />} label="WiFi Password">
                  <MaskedField value={net.wifi.password} label="WiFi password" />
                </InfoRow>
                <InfoRow icon={<Router className="h-3.5 w-3.5" />} label="Router">
                  {net.wifi.routerBrand} {net.wifi.routerModel}
                </InfoRow>
                <InfoRow icon={<Layers className="h-3.5 w-3.5" />} label="Mode">
                  <span className="text-foreground/70">{net.wifi.routerMode}</span>
                </InfoRow>
                <InfoRow icon={<Monitor className="h-3.5 w-3.5" />} label="Admin IP">
                  <span className="font-mono">{net.wifi.routerAdminIp}</span>
                </InfoRow>
                <InfoRow icon={<Key className="h-3.5 w-3.5" />} label="Admin Password">
                  <MaskedField value={net.wifi.routerAdminPassword} label="router admin password" />
                </InfoRow>
                {net.wifi.adminAccessNote && (
                  <div className="mt-3 px-3 py-2.5 rounded-lg bg-amber-500/8 border border-amber-500/15 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">{net.wifi.adminAccessNote}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground/60 italic">WiFi details not yet documented for this store.</p>
            )}

            {/* Chase Merchant ID */}
            <div className="mt-4 pt-4 border-t border-border/40">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3 flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" /> Credit Card (Chase)
              </p>
              <InfoRow icon={<CreditCard className="h-3.5 w-3.5" />} label="Terminal Model">
                {CC_TERMINAL}
              </InfoRow>
              <InfoRow icon={<CreditCard className="h-3.5 w-3.5" />} label="Merchant ID">
                <span className="font-mono">{net.merchantId}</span>
              </InfoRow>
              <InfoRow icon={<PhoneCall className="h-3.5 w-3.5" />} label="Chase Support">
                <span>{CHASE_SUPPORT.phone}</span>
                <span className="ml-2 text-[11px] text-muted-foreground">Co. # {CHASE_SUPPORT.companyNumber}</span>
              </InfoRow>
            </div>
          </div>

          {/* ── Device Locations or Server notes ── */}
          <div className="p-5">
            {net.deviceLocations.length > 0 ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Server className="h-3 w-3" /> Device Locations
                </p>
                <div className="space-y-4">
                  {net.deviceLocations.map((loc) => (
                    <div key={loc.area}>
                      <p className="text-[11px] font-semibold text-foreground/80 mb-1.5">{loc.area}</p>
                      <ul className="space-y-1">
                        {loc.devices.map((d) => (
                          <li key={d} className="flex items-start gap-2 text-[12px] text-foreground/65">
                            <span className="text-primary/40 mt-1 shrink-0">·</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Server className="h-3 w-3" /> System Notes
                </p>
                <div className="space-y-3 text-[12px] text-foreground/70 leading-relaxed">
                  <p>The <strong className="text-foreground/90">SonicWall</strong> is the first thing to check when the whole store loses internet, DRS, credit card processing, or WiFi — everything runs through it.</p>
                  <p>The <strong className="text-foreground/90">server</strong> is the brain for DRS. If it's off or disconnected from the SonicWall, no registers will work — even if the registers themselves are powered on.</p>
                  <p>The screen shared between the server and the nearest register toggles with <strong className="text-foreground/90">Scroll Lock × 2</strong> on the connected keyboard.</p>
                  <p className="text-[11px] text-muted-foreground/60 italic">Device locations for this store not yet documented.</p>
                </div>
              </>
            )}

            {/* Winmark support */}
            <div className="mt-4 pt-4 border-t border-border/40">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3 flex items-center gap-1.5">
                <PhoneCall className="h-3 w-3" /> Winmark Support
              </p>
              <InfoRow icon={<PhoneCall className="h-3.5 w-3.5" />} label="Phone">
                {WINMARK_SUPPORT.phone}
                <span className="ml-2 text-[11px] text-muted-foreground">Press 0 to skip tree</span>
              </InfoRow>
              <InfoRow icon={<Monitor className="h-3.5 w-3.5" />} label="Email">
                <span className="font-mono text-[11px]">{WINMARK_SUPPORT.email}</span>
              </InfoRow>
              <InfoRow icon={<Hash className="h-3.5 w-3.5" />} label="Store Number">
                Used on every support call — find it in Store Details above
              </InfoRow>
            </div>
          </div>
        </div>

        {/* ── Troubleshooting Quick Reference ── */}
        <div className="border-t border-border/60">
          <button
            onClick={() => setShowTroubleshooting((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-3 text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400/70" />
              Troubleshooting Quick Reference
            </span>
            {showTroubleshooting ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showTroubleshooting && (
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
              <div className="space-y-2">
                <p className="font-semibold text-foreground/80">System-wide outage (DRS + internet + WiFi down)</p>
                <ol className="space-y-1 text-foreground/65 list-decimal list-inside">
                  <li>Check SonicWall — is it powered on and securely plugged in?</li>
                  <li>Check all cable connections on the SonicWall</li>
                  <li>Reboot SonicWall if needed (power off, wait 30s, power on)</li>
                  <li>If internet returns but DRS doesn't, check the server</li>
                </ol>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground/80">DRS down but internet works</p>
                <ol className="space-y-1 text-foreground/65 list-decimal list-inside">
                  <li>Check the server — is it on? Does it show a connection?</li>
                  <li>Try restarting the server (all registers will disconnect temporarily)</li>
                  <li>Use Scroll Lock × 2 to toggle to server view on shared monitor</li>
                  <li>Call Winmark Support if server is up but DRS still won't connect</li>
                </ol>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground/80">Credit card terminal issues</p>
                <ol className="space-y-1 text-foreground/65 list-decimal list-inside">
                  <li>Terminal won't power on → call Chase ({CHASE_SUPPORT.phone})</li>
                  <li>Register and terminal out of sync → call Winmark</li>
                  <li>Moved/installed terminal not connecting → call Winmark</li>
                  <li>Have ready: store address, terminal serial #, Merchant ID, issue description</li>
                </ol>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground/80">Store phones not working</p>
                <ol className="space-y-1 text-foreground/65 list-decimal list-inside">
                  <li>Phones run on Vonage (VOIP) — they need internet to work</li>
                  <li>If internet is down, phones go down too</li>
                  <li>Customers still hear the automated menu but can't reach staff</li>
                  <li>Changes to call routing: contact Adam or Thuy only</li>
                </ol>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground/80">Printer not connecting</p>
                <ol className="space-y-1 text-foreground/65 list-decimal list-inside">
                  <li>General-use printers connect to store WiFi (not wired)</li>
                  <li>Make sure the computer/device is on the same network — not the 5G band</li>
                  <li>If password changed recently, reconnect the printer with new credentials</li>
                  <li>Warranty issues go through Bob's Best Buy account (Adam or Bob must bring it in)</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StoreInfo() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const { data: response } = useQuery<StoresResponse>({
    queryKey: ["/api/stores"],
    queryFn: () => fetch("/api/stores").then((r) => r.json()),
  });
  const stores = response?.stores ?? [];

  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? null;

  function selectStore(id: string) {
    setSelectedStoreId(id);
  }

  function goBack() {
    setSelectedStoreId(null);
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <AnimatePresence mode="wait">

        {/* ── Store grid ── */}
        {!selectedStoreId && (
          <motion.div key="store-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <Home className="h-4 w-4 text-primary" />
                </div>
                <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Store Info</h1>
              </div>
              <p className="text-muted-foreground mt-1">Select a store to view its details.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {stores.map((store, i) => (
                <motion.button
                  key={store.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => selectStore(store.id)}
                  className="text-left w-full"
                >
                  <Card className="h-full hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors leading-snug">
                          {store.name}
                        </CardTitle>
                        <Badge variant={store.type === "platos_closet" ? "default" : "secondary"} className="text-[10px] uppercase shrink-0">
                          {store.type === "platos_closet" ? "PC" : "SE"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      <div className="flex items-start text-xs text-muted-foreground gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{store.location}</span>
                      </div>
                      {store.externalId && (
                        <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                          <Hash className="w-3.5 h-3.5 shrink-0" />
                          <span>{store.externalId}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Store detail ── */}
        {selectedStoreId && selectedStore && (
          <motion.div key="store-detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

            {/* Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                All Stores
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-semibold">{selectedStore.name}</span>
            </div>

            {/* Store header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <Home className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold tracking-tight">{selectedStore.name}</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {selectedStore.type === "platos_closet" ? "Plato's Closet" : "Style Encore"} · #{selectedStore.externalId}
                  </p>
                </div>
              </div>

              <Link href="/tech-troubleshooting">
                <button className="flex items-center gap-2 px-3.5 py-2 bg-muted/60 text-foreground/80 rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-colors shrink-0 border border-border/60">
                  <Wrench className="h-3.5 w-3.5" />
                  Tech Troubleshooting
                </button>
              </Link>
            </div>

            {/* Store details + Brand Advantage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Store Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                      <p className="text-foreground">{selectedStore.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Store Number</p>
                      <p className="text-foreground font-mono">{selectedStore.externalId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                      <p className="text-foreground">{STORE_PHONES[selectedStore.id] ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <BrandAdvantageBlock storeId={selectedStore.id} />
            </div>

            {/* Network Information */}
            <NetworkInfoBlock storeId={selectedStore.id} storeName={selectedStore.name} />

            {/* Manager Notes */}
            <StoreNotesBlock storeId={selectedStore.id} />

            {/* Current Floorset */}
            <Card>
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <div className="p-1.5 bg-muted rounded-md shrink-0">
                      <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    Current Floorset
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground px-2.5 py-1 rounded-md bg-muted/50 border border-border/40">
                    Interactive editing coming soon
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                  This will become an interactive tool for editing your sales floor layout — rack positions, section assignments, and merchandise types per bar. Below is an example overhead layout.
                </p>
              </CardHeader>
              <CardContent className="pt-5">
                <FloorsetDiagram />
              </CardContent>
            </Card>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
