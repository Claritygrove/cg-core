# The Core — Build Queue

Last updated: 2026-04-04

## In Progress
- [x] Daily Power BI pull cron (4am ET) + hardcoded credentials in .env
- [ ] Store notes area (per-store, persistent)
- [ ] Floor planner page — rack placement layer
- [ ] Floor planner — floorset layer (subcategories + color coding)

## Blocked
- Fixed store fixture dimensions — Adam to drop JSON files into:
  `dashboard/src/data/store-fixtures/{storeId}.json`
  Format: `{ walls: [], fittingRooms: [], checkout: [], other: [] }` each with x,y,w,h,label
- Store floor plan images — coming Monday

## Not Started
- Floor planner maps (waiting for Monday)
- Reporting page — trigger data pull by date range from UI
- KPI data parsed + shown in Dashboard (once daily pull confirmed working)

## Completed
- Store Visit Report auto-pull via Playwright (all 7 stores)
- KPI Report auto-pull via Playwright (all 7 stores, ~2-5min each)
- Session auth for Power BI (session.json)

---

## Pickup Notes (if resuming after token limit)

### Daily Cron
- Script: `tools/winmark-puller/pull_report.py`
- Credentials stored in: `tools/winmark-puller/.env` (gitignored)
- Cron should run: `kpi --all` + `store-visit --all --start YESTERDAY --end YESTERDAY`
- Time: 4am ET = 8am UTC (or 9am UTC in EDT)

### Store Notes
- Backend: `server/notes.ts` — file-based JSON at `dashboard/data/store-notes.json`
- Routes: GET/POST `/api/stores/:storeId/notes`
- Frontend: new `StoreNotes` component on store detail page in `Recommendations.tsx`

### Floor Planner
- New page: `src/pages/floor-planner/FloorPlanner.tsx`
- Route: `/floor-planner`
- Added to Layout nav
- Two layers toggled by tab:
  1. Rack Placement Layer — drag/drop racks, rotate, label = rack type
     - Rack types: Round, 4-way, Straight, Waterfall, Table, Gondola, Bin
     - Text rotation: always readable (0° or 90°, never 180°/270°)
  2. Floorset Layer — racks frozen, label = subcategory, editable
     - Color code setting 1: Men's / Women's (2 colors)
     - Color code setting 2: Spring/Summer / Fall/Winter / Basic (3 colors)
     - Color code setting 3: each subcategory = unique color
- Fixed fixtures: loaded from `src/data/store-fixtures/{storeId}.json`
- Rack layouts saved to `dashboard/data/floor-plans/{storeId}.json` (backend)
