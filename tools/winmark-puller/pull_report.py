#!/usr/bin/env python3
"""
Winmark Report Puller — Store Visit + Store Performance KPIs
Automates Power BI CSV downloads for Eagle V stores.

Usage:
  python3 pull_report.py --login
  python3 pull_report.py store-visit --all --start 2025-03-01 --end 2025-03-31
  python3 pull_report.py store-visit --store 80237 --start 2025-03-01 --end 2025-03-31
  python3 pull_report.py kpi --all          # always pulls current inventory (today)
  python3 pull_report.py kpi --store 80237
"""

import argparse
import os
import sys
from pathlib import Path
from datetime import datetime, date, timedelta
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# Load credentials from .env if present
_env = Path(__file__).parent / ".env"
if _env.exists():
    for line in _env.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

SHAREPOINT_URL = "https://winmarkconnect.sharepoint.com"
REPORT_HUB_URL = (
    "https://app.powerbi.com/groups/me/apps/55f5a8da-2249-4aed-a041-fa17d680c3d1"
    "/rdlreports/aa60d283-7ffb-47fe-bfa2-ded6c7401463?experience=power-bi&noSignUpCheck=1"
)
STORE_VISIT_URL = (
    "https://app.powerbi.com/groups/me/apps/55f5a8da-2249-4aed-a041-fa17d680c3d1"
    "/rdlreports/82ed7539-85b7-49b9-a7a8-f36c9637b46a?experience=power-bi&noSignUpCheck=1"
)
SESSION_FILE = Path(__file__).parent / "session.json"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "dashboard" / "01-inputs"

STORES = {
    "80237": "PC Portage",
    "60039": "SE Portage",
    "80185": "PC East Lansing",
    "80634": "PC Jackson",
    "80726": "PC Ann Arbor",
    "80783": "PC Canton",
    "80877": "PC Novi",
}


def to_mmddyyyy(date_str: str) -> str:
    d = datetime.strptime(date_str, "%Y-%m-%d")
    return d.strftime("%m/%d/%Y")


def login(playwright, headless=False):
    """Log in to Microsoft, save session. Uses .env credentials if available."""
    email = os.environ.get("WINMARK_EMAIL", "")
    password = os.environ.get("WINMARK_PASSWORD", "")
    auto = bool(email and password)

    browser = playwright.chromium.launch(headless=headless if auto else False)
    context = browser.new_context()
    page = context.new_page()
    page.set_viewport_size({"width": 1400, "height": 900})

    page.goto("https://login.microsoftonline.com", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(2000)

    if auto:
        print("Auto-logging in with saved credentials...")
        # Enter email
        try:
            page.locator("input[type='email'], input[name='loginfmt']").first.fill(email)
            page.get_by_role("button", name="Next").click()
            page.wait_for_timeout(2000)
        except Exception:
            pass
        # Enter password
        try:
            page.locator("input[type='password'], input[name='passwd']").first.fill(password)
            page.get_by_role("button", name="Sign in").click()
            page.wait_for_timeout(3000)
        except Exception:
            pass
        # "Stay signed in?" → Yes
        try:
            page.get_by_role("button", name="Yes").click(timeout=5000)
        except Exception:
            pass
    else:
        print("Manual login: enter your Microsoft credentials in the browser window.")

    print("Waiting for SharePoint...")
    page.goto(SHAREPOINT_URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)

    print("Authenticating Power BI...")
    page.goto(REPORT_HUB_URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(8000)

    context.storage_state(path=str(SESSION_FILE))
    print("Session saved.")
    browser.close()


def get_report_frame(page, timeout=60):
    """Poll until the paginated report iframe appears, then give it time to render."""
    for _ in range(timeout):
        for frame in page.frames:
            if "paginated-reports.powerbi.com" in frame.url:
                page.wait_for_timeout(4000)
                return frame
        page.wait_for_timeout(1000)
    raise RuntimeError("Paginated report frame never appeared.")


def wait_for_export_enabled(frame, page, timeout=120):
    """Poll until the Export button is enabled (report has finished rendering)."""
    for _ in range(timeout):
        try:
            btn = frame.locator("button", has_text="Export").first
            if btn.is_enabled():
                return
        except Exception:
            pass
        page.wait_for_timeout(1000)
    raise RuntimeError("Export button never became enabled — report may have failed.")


def fill_store_number(frame, page, store_number: str, field_id: str):
    """Fill the store number combobox and close the dropdown."""
    inp = frame.locator(f"#{field_id}")
    inp.click()
    inp.fill(store_number)
    page.wait_for_timeout(800)
    try:
        frame.locator("[role='option']").filter(has_text=store_number).first.click(timeout=2000)
    except Exception:
        frame.press(f"#{field_id}", "Enter")
    page.wait_for_timeout(500)


def export_csv(frame, page, dest: Path):
    """Click Export → CSV and save the download."""
    with page.expect_download(timeout=60000) as dl_info:
        frame.locator("button", has_text="Export").click()
        page.wait_for_timeout(1500)
        try:
            frame.get_by_text("CSV").first.click(timeout=5000)
        except Exception:
            frame.get_by_text("Comma-separated values").first.click(timeout=5000)
    dl_info.value.save_as(str(dest))


# ── Store Visit Report ──────────────────────────────────────────────────────

def pull_store_visit(page, store_number: str, start_date: str, end_date: str):
    store_name = STORES.get(store_number, store_number)
    print(f"  Store Visit {store_name} ({store_number})...", end=" ", flush=True)

    page.goto(STORE_VISIT_URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_load_state("domcontentloaded", timeout=60000)
    frame = get_report_frame(page)

    fill_store_number(frame, page, store_number, "StoreNumber-input")

    frame.locator("#datePicker-input8").click()
    frame.locator("#datePicker-input8").fill(to_mmddyyyy(start_date))
    frame.press("#datePicker-input8", "Tab")
    page.wait_for_timeout(300)

    frame.locator("#datePicker-input13").click()
    frame.locator("#datePicker-input13").fill(to_mmddyyyy(end_date))
    frame.press("#datePicker-input13", "Tab")
    page.wait_for_timeout(300)

    frame.locator("button", has_text="View report").click()
    wait_for_export_enabled(frame, page, timeout=60)

    timestamp = datetime.now().strftime("%Y%m%d")
    filename = f"store_visit_{store_number}_{start_date}_{end_date}_{timestamp}.csv"
    dest = OUTPUT_DIR / filename
    export_csv(frame, page, dest)
    print(f"saved -> {filename}")


# ── Store Performance KPIs Report ──────────────────────────────────────────

def pull_kpi(page, store_number: str):
    store_name = STORES.get(store_number, store_number)
    today = date.today().strftime("%Y-%m-%d")
    print(f"  KPI {store_name} ({store_number})...", end=" ", flush=True)

    # Navigate to hub and click Store Performance KPIs in the sidebar
    page.goto(REPORT_HUB_URL, wait_until="domcontentloaded", timeout=60000)
    get_report_frame(page)
    page.wait_for_timeout(1000)

    # Click the KPI sidebar link
    page.locator("text=Store Performance KPIs O").click()
    page.wait_for_timeout(1000)

    # Wait for the KPI form to appear (KPI uses StoreNumber-input, hub uses StoreNbr-input)
    frame = get_report_frame(page)
    frame.locator("#StoreNumber-input").wait_for(state="visible", timeout=60000)
    page.wait_for_timeout(1000)

    fill_store_number(frame, page, store_number, "StoreNumber-input")

    # Dates default to current period — inventory is always current regardless of range
    frame.locator("button", has_text="View report").click()

    # This report is slow (can take 2-5 min) — poll up to 5 min for Export to enable
    wait_for_export_enabled(frame, page, timeout=300)

    timestamp = datetime.now().strftime("%Y%m%d")
    filename = f"kpi_{store_number}_{today}_{timestamp}.csv"
    dest = OUTPUT_DIR / filename
    export_csv(frame, page, dest)
    print(f"saved -> {filename}")


# ── Orchestration ───────────────────────────────────────────────────────────

def run_store_visit(stores, start_date, end_date):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Store Visit: {len(stores)} store(s), {start_date} → {end_date}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(storage_state=str(SESSION_FILE))
        page = context.new_page()
        page.set_viewport_size({"width": 1400, "height": 900})
        failed = []
        for store in stores:
            try:
                pull_store_visit(page, store, start_date, end_date)
            except Exception as e:
                print(f"FAILED: {e}")
                failed.append(store)
        browser.close()
    _report_results(failed)


def run_kpi(stores):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"KPI snapshot: {len(stores)} store(s) as of today")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(storage_state=str(SESSION_FILE))
        page = context.new_page()
        page.set_viewport_size({"width": 1400, "height": 900})
        failed = []
        for store in stores:
            try:
                pull_kpi(page, store)
            except Exception as e:
                print(f"FAILED: {e}")
                failed.append(store)
        browser.close()
    _report_results(failed)


def _report_results(failed):
    if failed:
        print(f"\nFailed: {', '.join(failed)}")
        print("Run --login if the session expired.")
    else:
        print(f"\nAll done. Files in: {OUTPUT_DIR}")


def parse_stores(args):
    if args.all:
        return list(STORES.keys())
    if args.store:
        if args.store not in STORES:
            print(f"Unknown store: {args.store}. Valid: {', '.join(STORES.keys())}")
            sys.exit(1)
        return [args.store]
    return None


def main():
    parser = argparse.ArgumentParser(description="Pull Winmark reports from Power BI")
    sub = parser.add_subparsers(dest="cmd")

    # Login
    sub.add_parser("login", help="Log in and save session")

    # Store Visit
    sv = sub.add_parser("store-visit", help="Pull Store Visit Report")
    sv.add_argument("--store", help="Winmark store number")
    sv.add_argument("--all", action="store_true", help="All 7 stores")
    sv.add_argument("--start", required=True, help="Start date YYYY-MM-DD")
    sv.add_argument("--end", required=True, help="End date YYYY-MM-DD")

    # KPI
    kp = sub.add_parser("kpi", help="Pull Store Performance KPIs (daily inventory snapshot)")
    kp.add_argument("--store", help="Winmark store number")
    kp.add_argument("--all", action="store_true", help="All 7 stores")

    args = parser.parse_args()

    if not args.cmd:
        parser.print_help()
        sys.exit(1)

    if args.cmd == "login":
        with sync_playwright() as p:
            login(p)
        return

    if not SESSION_FILE.exists():
        print("No session found. Run: python3 pull_report.py login")
        sys.exit(1)

    stores = parse_stores(args)
    if not stores:
        parser.error("Provide --store NUMBER or --all")

    if args.cmd == "store-visit":
        run_store_visit(stores, args.start, args.end)
    elif args.cmd == "kpi":
        run_kpi(stores)


if __name__ == "__main__":
    main()
