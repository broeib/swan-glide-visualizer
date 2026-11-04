#!/usr/bin/env bash
set -euo pipefail

# Determine repository root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_DIR}"

# Default parameters
COUNT=3
MOOD="random"
INSTRUMENT="random"
THEME="random"
OUTPUT_DIR="${PROJECT_DIR}/output"
EXTRA_ARGS=()

# Parse command line flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --count|-c)
      COUNT="$2"
      shift 2
      ;;
    --mood|-m)
      MOOD="$2"
      shift 2
      ;;
    --instrument|-i)
      INSTRUMENT="$2"
      shift 2
      ;;
    --theme|-t)
      THEME="$2"
      shift 2
      ;;
    --output-dir|-o)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --duration-beats|-d)
      EXTRA_ARGS+=("--duration-beats" "$2")
      shift 2
      ;;
    --artist)
      EXTRA_ARGS+=("--artist" "$2")
      shift 2
      ;;
    --help|-h)
      echo "Swan Glide Daily Automation Pipeline"
      echo "Usage: bash scripts/daily-pipeline.sh [options]"
      echo ""
      echo "Options:"
      echo "  --count <N>             Number of videos to render (default: 3)"
      echo "  --mood <archetype>      Harmonic archetype or 'random'"
      echo "  --instrument <inst>     Instrument visualization ('guitar', 'piano', or 'random')"
      echo "  --theme <preset>        Theme preset ('pastel', 'dark', 'sunset', 'lofi', 'cream', or 'random')"
      echo "  --output-dir <path>     Target output directory (default: output)"
      echo "  --duration-beats <N>    Render duration limit in beats (optional test mode)"
      echo "  --help                  Show this help message"
      exit 0
      ;;
    *)
      EXTRA_ARGS+=("$1")
      shift
      ;;
  esac
done

# Ensure output directory exists
mkdir -p "${OUTPUT_DIR}"

# Set shared library path for headless Chromium on Linux
export LD_LIBRARY_PATH="/usr/lib/firefox-esr:${LD_LIBRARY_PATH:-}"

echo "===================================================="
echo "🕊️  Swan Glide Daily Automation: Starting Execution"
echo "    Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "    Batch Count: ${COUNT}"
echo "    Mood Archetype: ${MOOD}"
echo "    Instrument: ${INSTRUMENT}"
echo "    Visual Theme: ${THEME}"
echo "    Output Directory: ${OUTPUT_DIR}"
echo "===================================================="

# Execute Node pipeline generator
node "${PROJECT_DIR}/scripts/run-pipeline.js" \
  --count "${COUNT}" \
  --mood "${MOOD}" \
  --instrument "${INSTRUMENT}" \
  --theme "${THEME}" \
  --output-dir "${OUTPUT_DIR}" \
  "${EXTRA_ARGS[@]}"

# 30-Day Retention Policy Cleanup
echo ""
echo "Running 30-day retention cleanup on ${OUTPUT_DIR}..."

# Remove date-stamped output folders older than 30 days
if [ -d "${OUTPUT_DIR}" ]; then
  find "${OUTPUT_DIR}" -mindepth 1 -maxdepth 1 -type d -name "20*" -mtime +30 -exec echo "Removing expired folder: {}" \; -exec rm -rf {} + 2>/dev/null || true
  find "${OUTPUT_DIR}" -mindepth 2 -maxdepth 2 -type d -name "song_*" -mtime +30 -exec echo "Removing expired song bundle: {}" \; -exec rm -rf {} + 2>/dev/null || true
fi

echo "Retention cleanup complete."
echo "Daily pipeline execution finished at $(date -u '+%Y-%m-%d %H:%M:%S UTC')."
echo "===================================================="
