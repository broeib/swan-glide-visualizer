#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "${PROJECT_DIR}/output"

CRON_JOB_TAG="# Swan Glide Daily Video Pipeline"
CRON_CMD="0 9 * * * cd ${PROJECT_DIR} && bash scripts/daily-pipeline.sh >> output/pipeline.log 2>&1"

# Check existing crontab
EXISTING_CRON="$(crontab -l 2>/dev/null || true)"

if echo "${EXISTING_CRON}" | grep -Fq "daily-pipeline.sh"; then
  echo "🕊️  Swan Glide Video Pipeline is already enabled in crontab."
  echo "    Schedule: Daily at 09:00 UTC"
  echo "    Log file: ${PROJECT_DIR}/output/pipeline.log"
  exit 0
fi

# Install new crontab entry
NEW_CRON="$(
  if [ -n "${EXISTING_CRON}" ]; then
    echo "${EXISTING_CRON}"
  fi
  echo "${CRON_JOB_TAG}"
  echo "${CRON_CMD}"
)"

echo "${NEW_CRON}" | crontab -

echo "===================================================="
echo "🕊️  Swan Glide Video Pipeline Enabled Successfully!"
echo "    Schedule: Daily at 09:00 UTC (0 9 * * *)"
echo "    Target Script: ${PROJECT_DIR}/scripts/daily-pipeline.sh"
echo "    Log file: ${PROJECT_DIR}/output/pipeline.log"
echo "    To deactivate at any time, run: npm run pipeline:disable"
echo "===================================================="
