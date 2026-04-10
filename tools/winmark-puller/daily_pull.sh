#!/bin/bash
# Daily Winmark data pull — runs at 4am ET (cron: 0 8 * * *)
# Fetches KPI snapshot + yesterday's Store Visit report for all 7 stores

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/pull.log"
PYTHON="python3"

echo "" >> "$LOG_FILE"
echo "=== $(date '+%Y-%m-%d %H:%M:%S') Starting daily pull ===" >> "$LOG_FILE"

# Yesterday's date for Store Visit report
YESTERDAY=$(date -v-1d '+%Y-%m-%d' 2>/dev/null || date -d 'yesterday' '+%Y-%m-%d')

cd "$SCRIPT_DIR"

# Refresh session (auto-logins with saved credentials)
echo "Refreshing session..." >> "$LOG_FILE"
$PYTHON pull_report.py login >> "$LOG_FILE" 2>&1

# Pull KPI snapshot for all stores (today's inventory)
echo "Pulling KPI reports..." >> "$LOG_FILE"
$PYTHON pull_report.py kpi --all >> "$LOG_FILE" 2>&1

# Pull Store Visit report for yesterday
echo "Pulling Store Visit for $YESTERDAY..." >> "$LOG_FILE"
$PYTHON pull_report.py store-visit --all --start "$YESTERDAY" --end "$YESTERDAY" >> "$LOG_FILE" 2>&1

echo "=== Done ===" >> "$LOG_FILE"
