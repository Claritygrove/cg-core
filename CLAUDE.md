# Eagle V Corporation

## What this is
Tools and automations for Eagle V Corporation — a Winmark franchise holding company
operating 6 Plato's Closet locations and 1 Style Encore in Michigan.

## Key people
- Adam Brown — COO (that's me)
- Erin Ritchie — District Manager
- Lyric Muraoka — District Manager
- Thuy Heykoop — Marketing Director

## Stores
| ID | Name | Type | Winmark # |
|---|---|---|---|
| pc-80237 | PC Portage | Plato's Closet | 80237 |
| se-60039 | SE Portage | Style Encore | 60039 |
| pc-80185 | PC East Lansing | Plato's Closet | 80185 |
| pc-80634 | PC Jackson | Plato's Closet | 80634 |
| pc-80726 | PC Ann Arbor | Plato's Closet | 80726 |
| pc-80783 | PC Canton | Plato's Closet | 80783 |
| pc-80877 | PC Novi | Plato's Closet | 80877 |

## External systems
- **Winmark**: SharePoint CSV exports — store visit reports, sales + transaction data
- **When I Work (WIW)**: Scheduling only — XLSX exports used for scheduled labor hours
- **ADP**: Payroll and clock-in — source of truth for actual labor cost (not yet integrated)
- **QuickBooks Online (QBO)**: Accounting — API exists but dev/sandbox only, not production-approved yet
- **Five Stars**: Loyalty program — not yet integrated

## Business context
- ~270 seasonal employees
- $10M+ annual revenue
- HR anchored to March 2025 Employee Handbook
- Flag anything that could conflict with Michigan employment law
- All tools are internal use only — no public-facing output

---

## The Core Dashboard (`dashboard/`)

### Stack
- React 18 + Vite 5 frontend (port 3000)
- Express 4 backend (port 3001)
- `npm run dev` starts both via concurrently (tsx watch for server, vite for client)
- ESM project — `xlsx` must be imported via `createRequire` (it's a CommonJS package)
- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- React Query for data fetching, wouter for routing, framer-motion for animations

### Data flow
1. Drop CSV/XLSX files into `dashboard/01-inputs/`
2. Server reads them on each `/api/stores` request
3. Winmark CSV → sales + transactions per store
4. WIW XLSX → scheduled labor hours per store
5. QBO API → reserved until production approval is obtained

### Known file format quirks

**Winmark Store Visit CSV:**
- Line index 1 (second line), field 0 = 5-digit Winmark store number
- Find the row starting with `Sales_TYLbl` — that's the header row
- Data row is immediately after the header row
- Relevant fields: `Sales_YTDTY`, `Sales_YTDLY`, `Sales_TrxCountYTDTY`, `Sales_TrxCountYTDLY`

**When I Work XLSX:**
- One workbook, multiple sheets per store
- Only process sheets named `Hourly - {Store Name}` (skip Schedule sheets)
- Column `Total Hours` = hours per employee row — cap values at <100 to filter junk rows
- Fallback: sum columns whose headers match month name pattern, cap individual values at <24

### QBO OAuth
- Redirect URI: `http://localhost:3001/api/integrations/quickbooks/oauth/callback`
- Tokens stored in `dashboard/data/tokens.json` (gitignored)
- Delete `tokens.json` to force fallback to CSV file mode
