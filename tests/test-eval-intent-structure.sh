#!/bin/bash
# Test: eval-intent-scorer agent structure validation
# Validates that the agent file has required sections and the rubric has required dimensions.
# Does NOT invoke an LLM — structural checks only.
#
# Usage: bash tests/test-eval-intent-structure.sh
# Exit code: 0 = all tests pass, 1 = failures detected

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

PASS=0
FAIL=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

check() {
  local name="$1"
  local condition="$2"
  if eval "$condition" > /dev/null 2>&1; then
    green "  PASS: $name"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $name"
    FAIL=$((FAIL + 1))
  fi
}

bold "=== Rubric Structure ==="
RUBRIC="$ROOT/rubrics/eval-intent.md"
check "rubric file exists" "[ -f '$RUBRIC' ]"
check "intent_coverage dimension present" "grep -q 'Intent Coverage' '$RUBRIC'"
check "anti_pattern_detection dimension present" "grep -q 'Anti-Pattern Detection' '$RUBRIC'"
check "journey_completeness dimension present" "grep -q 'Journey Completeness' '$RUBRIC'"
check "implementation_independence dimension present" "grep -q 'Implementation Independence' '$RUBRIC'"
check "calibration band 1-3 present" "grep -q '1-3' '$RUBRIC'"
check "calibration band 4-6 present" "grep -q '4-6' '$RUBRIC'"
check "calibration band 7-8 present" "grep -q '7-8' '$RUBRIC'"
check "calibration band 9-10 present" "grep -q '9-10' '$RUBRIC'"
check "scoring weights table present" "grep -q '0.30' '$RUBRIC'"
check "gate decision section present" "grep -q 'Gate Decision' '$RUBRIC'"
check "anti-inflation guidance present" "grep -q 'Anti-Inflation' '$RUBRIC'"

bold "=== Agent Structure ==="
AGENT="$ROOT/agents/eval-intent-scorer/AGENT.md"
check "agent file exists" "[ -f '$AGENT' ]"
check "agent has Read tool" "grep -q '  - Read' '$AGENT'"
check "agent has Write tool" "grep -q '  - Write' '$AGENT'"
check "agent has Glob tool" "grep -q '  - Glob' '$AGENT'"
check "agent references rubric path" "grep -q 'eval-intent.md' '$AGENT'"
check "agent references SYSTEM-SPEC conflict check" "grep -q 'SYSTEM-SPEC' '$AGENT'"
check "agent references regression check" "grep -q 'regression' '$AGENT'"
check "agent defines output YAML format" "grep -q 'gate-2a-eval-intent.yml' '$AGENT'"
check "agent has 4 dimensions in output" "grep -cE 'intent_coverage|anti_pattern_detection|journey_completeness|implementation_independence' '$AGENT' | grep -qE '^[4-9]|^[1-9][0-9]'"

bold "=== Eval-Authoring Skill Structure ==="
SKILL="$ROOT/skills/eval-authoring/SKILL.md"
check "skill file exists" "[ -f '$SKILL' ]"
check "skill handles /sdlc eval command" "grep -q 'sdlc eval' '$SKILL'"
check "skill references partial session marker" "grep -q 'partial' '$SKILL'"
check "skill references eval-intent-scorer agent" "grep -q 'eval-intent-scorer' '$SKILL'"
check "skill handles interruption/resume" "grep -qE 'resume|interrupt' '$SKILL'"

bold "=== Pipeline Integration ==="
SDLC_RUN="$ROOT/skills/sdlc-run/SKILL.md"
check "sdlc-run references Phase 2a" "grep -qE '2a|eval-authoring|eval.authoring' '$SDLC_RUN'"
check "sdlc-run position table has eval-intent check" "grep -q 'gate-2a-eval-intent' '$SDLC_RUN'"

SDLC="$ROOT/skills/sdlc/SKILL.md"
check "sdlc routing table has /sdlc eval" "grep -qE '/sdlc eval|sdlc.*eval' '$SDLC'"

GATE_CHECK="$ROOT/skills/gate-check/SKILL.md"
check "gate-check lists eval-intent gate" "grep -q 'eval-intent' '$GATE_CHECK'"

bold "=== Results ==="
TOTAL=$((PASS + FAIL))
echo "Passed: $PASS / $TOTAL"
[ "$FAIL" -eq 0 ] && green "All tests passed." || { red "$FAIL test(s) failed."; exit 1; }
