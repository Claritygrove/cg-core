#!/usr/bin/env python3
"""Debug — click Store Performance KPIs report and capture URL + inputs."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import time

SESSION_FILE = Path(__file__).parent / "session.json"
DEBUG_DIR = Path(__file__).parent / "debug_screenshots"
DEBUG_DIR.mkdir(exist_ok=True)

REPORT_HUB_URL = (
    "https://app.powerbi.com/groups/me/apps/55f5a8da-2249-4aed-a041-fa17d680c3d1"
    "/rdlreports/aa60d283-7ffb-47fe-bfa2-ded6c7401463?experience=power-bi&noSignUpCheck=1"
)

def wait_for_frame(page, timeout=60):
    for _ in range(timeout):
        for f in page.frames:
            if "paginated-reports.powerbi.com" in f.url:
                time.sleep(4)
                return f
        time.sleep(1)
    return None

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(storage_state=str(SESSION_FILE))
    page = context.new_page()
    page.set_viewport_size({"width": 1400, "height": 900})

    page.goto(REPORT_HUB_URL)
    page.wait_for_load_state("load", timeout=60000)

    # Wait for the hub to fully render (frame appears)
    frame = wait_for_frame(page, timeout=60)
    print(f"Hub loaded. URL: {page.url}")

    # Click "Store Performance KPIs" in the left sidebar
    # The sidebar is in the main page (not the frame)
    print("Clicking Store Performance KPIs...")
    page.locator("text=Store Performance KPIs O").click()
    time.sleep(3)
    print(f"URL after click: {page.url}")

    # Wait for the new report's frame
    frame2 = wait_for_frame(page, timeout=60)
    if not frame2:
        print("Frame not found:", [f.url for f in page.frames])
        browser.close()
        exit(1)

    page.screenshot(path=str(DEBUG_DIR / "kpi_loaded.png"))
    print(f"Frame: {frame2.url}")

    inputs = frame2.locator("input").all()
    print(f"\nInputs ({len(inputs)}):")
    for inp in inputs:
        try:
            print(f"  id={inp.get_attribute('id')} "
                  f"placeholder={inp.get_attribute('placeholder')} "
                  f"value={inp.input_value()}")
        except Exception:
            pass

    buttons = frame2.locator("button").all()
    print(f"\nButtons ({len(buttons)}):")
    for btn in buttons:
        try:
            txt = btn.inner_text().strip()
            if txt:
                print(f"  '{txt}'")
        except Exception:
            pass

    # Now fill and run for one store to see CSV structure
    print("\nFilling store 80237, running report...")
    store_inp = frame2.locator("#StoreNbr-input, #StoreNumber-input").first
    store_inp.click()
    store_inp.fill("80237")
    time.sleep(0.8)
    try:
        frame2.locator("[role='option']").filter(has_text="80237").first.click(timeout=2000)
    except Exception:
        frame2.press(store_inp, "Enter")
    time.sleep(0.5)

    frame2.locator("button", has_text="View report").click()
    print("Waiting 30s for render...")
    time.sleep(30)

    page.screenshot(path=str(DEBUG_DIR / "kpi_rendered.png"), full_page=True)

    # Check buttons now
    buttons2 = frame2.locator("button").all()
    print("\nButtons after render:")
    for btn in buttons2:
        try:
            txt = btn.inner_text().strip()
            visible = btn.is_visible()
            enabled = btn.is_enabled()
            if txt:
                print(f"  '{txt}' visible={visible} enabled={enabled}")
        except Exception:
            pass

    browser.close()
