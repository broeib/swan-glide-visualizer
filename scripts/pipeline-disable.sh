#!/usr/bin/env bash
set -euo pipefail

EXISTING_CRON="$(crontab -l 2>/dev/null || true)"

if [ -z "${EXISTING_CRON}" ] || ! echo "${EXISTING_CRON}" | grep -Fq "daily-pipeline.sh"; then
  echo "🕊️  Swan Glide Video Pipeline is already inactive (not found in crontab)."
  exit 0
fi

# Filter out the pipeline entry and comment
FILTERED_CRON="$(echo "${EXISTING_CRON}" | grep -v "daily-pipeline.sh" | grep -v "# Swan Glide Daily Video Pipeline" || true)"

# Re-install remaining cron jobs or remove crontab if now empty
CLEANED="$(echo "${FILTERED_CRON}" | sed '/^[[:space:]]*$/d')"

if [ -n "${CLEANED}" ]; then
  echo "${CLEANED}" | crontab -
else
  crontab -r 2>/dev/null || true
fi

echo "===================================================="
echo "🕊️  Swan Glide Video Pipeline Disabled Successfully!"
echo "    Daily scheduled render job has been safely removed from crontab."
echo "    On-demand CLI rendering remains available via: npm run pipeline:generate"
echo "===================================================="
