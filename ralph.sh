#!/bin/bash
# Ralph loop for the local markdown issue tracker (.scratch/*/issues).
#
# Each iteration is a FRESH `claude -p` process — context clears between
# tickets by construction. The iteration prompt (docs/agents/ralph-prompt.md)
# invokes /mattpocock-skills:implement on exactly one unblocked
# ready-for-agent ticket, closes and commits it, and reports a <promise> tag
# the loop dispatches on.
#
# Usage: bash ralph.sh [issues-dir] [max-iterations]
#   issues-dir      default .scratch/content-boundary-engine/issues
#   max-iterations  default 10
#
# Scoped to ONE issues directory on purpose: .scratch holds retired efforts
# (e.g. reusable-label-printing, from before the app was stripped) whose
# tickets still say ready-for-agent and must not be picked up.

set -uo pipefail
cd "$(dirname "$0")"

ISSUES_DIR="${1:-.scratch/content-boundary-engine/issues}"
MAX="${2:-10}"
PROMPT_FILE="docs/agents/ralph-prompt.md"
LOG_DIR=".scratch/ralph-logs"
mkdir -p "$LOG_DIR"

if [ ! -d "$ISSUES_DIR" ]; then
  echo "ralph: issues directory not found: $ISSUES_DIR" >&2
  exit 1
fi

for ((i = 1; i <= MAX; i++)); do
  if ! grep -rq "Status:\*\* ready-for-agent" "$ISSUES_DIR" 2>/dev/null; then
    echo "ralph: no ready-for-agent tickets remain — complete."
    exit 0
  fi

  log="$LOG_DIR/$(date +%Y%m%d-%H%M%S)-iter$i.log"
  echo "=== ralph iteration $i/$MAX ($(date +%H:%M:%S), log: $log) ==="

  claude -p "$(cat "$PROMPT_FILE")

Issues directory for this run: $ISSUES_DIR" \
    --dangerously-skip-permissions \
    --add-dir ../offby2-demo \
    2>&1 | tee "$log"
  out="$(cat "$log")"

  case "$out" in
    *"<promise>COMPLETE</promise>"*)
      echo "ralph: agent reports all tickets done."
      exit 0 ;;
    *"<promise>BLOCKED"*)
      echo "ralph: agent reports blocked — human needed. See $log"
      exit 1 ;;
    *"<promise>DONE"*)
      continue ;;
    *)
      echo "ralph: no promise tag in output — stopping so nothing runs away. See $log"
      exit 1 ;;
  esac
done

echo "ralph: hit max iterations ($MAX) with tickets still open."
exit 1
