# Spec-Bench: Speculator Benchmark Harness

*Does spec quality predict implementation quality? A reusable benchmark to find out.*

---

## 1. Purpose

The Speculator manifesto promises a "spec quality benchmark dataset — the SWE-bench for specifications." Spec-Bench is the harness that delivers on that promise.

It answers three questions:
1. **Validation** — Does higher Speculator score → better implementation outcomes?
2. **Calibration** — Are the rubric weights, thresholds, and self-improvement loop tuned correctly?
3. **Comparison** — How do different LLM × harness × process combinations perform at spec writing?

Spec-Bench is designed to be **reusable** — run it with any PRD, any target matrix, any number of iterations. The first run uses a Weather + Transport app. Future runs can use any PRD from the growing library.

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        SPEC-BENCH HARNESS                        │
│                                                                  │
│  PRD Library ──► Target Matrix ──► Spec Generation               │
│       │              │                    │                       │
│       │              │            ┌───────┴────────┐             │
│       │              │            │  Per-target:    │             │
│       │              │            │  LLM × Harness  │             │
│       │              │            │  × Process      │             │
│       │              │            └───────┬────────┘             │
│       │              │                    │                       │
│       │              │         Speculator Scoring                 │
│       │              │         + Iteration Loop (max 3)           │
│       │              │              │         │                   │
│       │              │         original    improved               │
│       │              │              │         │                   │
│       │              │     Constant Implementer (×N runs)         │
│       │              │              │         │                   │
│       │              │         ┌────┴─────────┴────┐             │
│       │              │         │  Review Layer:     │             │
│       │              │         │  Functional Tests  │             │
│       │              │         │  + LLM-as-Judge    │             │
│       │              │         └────────┬──────────┘             │
│       │              │                  │                         │
│       │              │         Comparative Report                 │
└──────────────────────────────────────────────────────────────────┘
```

### Core Loop

1. **PRD** (constant per run) defines the app to build
2. **Target matrix** defines which LLM × harness × process combinations generate specs
3. Each target generates a spec, which Speculator scores and iterates (up to 3 times, targeting 7.8)
4. Both original and improved specs go to a **constant implementer** (Claude Code Sonnet 4.6 + Superpowers, headless)
5. Implementations are reviewed by **automated functional tests** (objective) and an **LLM-as-judge** (qualitative)
6. Results are aggregated into a **comparative report** with correlation analysis

### Key Design Decisions

- **PRDs are reusable** — a library of benchmark PRDs, starting with Weather + Transport
- **Target adapters** — each harness (Claude Code, Copilot CLI) gets an adapter script that normalizes the interface
- **Two specs per target** — original (v0) + Speculator-improved (best version after iteration), both go to implementation
- **Constant implementer** — identical config for every implementation run, isolating spec quality as the variable
- **Two-layer review** — automated functional tests (objective floor) + LLM-as-judge (qualitative signal)
- **All targets run headless** — `--dangerously-skip-permissions` (Claude Code) or equivalent auto-approve mode, no human gates during runs, to avoid skewing clock time
- **Structured output** — everything YAML, machine-readable, diffable across runs

## 3. PRD Library

### PRD Design Principles

Each benchmark PRD must be:
- **Small enough** to complete in a single session (~60-120 min implementation)
- **Rich enough** to differentiate spec quality — with edge cases, implied requirements, and ambiguous areas that a good spec should independently surface
- **Objectively verifiable** — every requirement maps to a functional test
- **Reusable** — parameterised where possible so future runs aren't identical replays

### PRD Structure

```yaml
---
id: PRD-001
name: "Personalised Daily Weather + Transport"
version: 1.0
difficulty: medium
estimated_features: 15
estimated_impl_time: 90min
---
```

Each PRD contains:

- **Purpose** — what the app does and why
- **Requirements** — explicit, numbered, testable requirements
- **Implied Requirements** — things a good spec should independently surface (error handling, loading states, empty states, accessibility). These are *not* shown to spec generators — they're used during review to measure whether the spec captured them.
- **Functional Checklist** — machine-readable checklist used by Layer 1 automated tests (e.g., `F01: Displays current temperature for configured location`)

### Inaugural PRD: Personalised Daily Weather + Transport

A single-page web app showing personalised weather and local transport departures based on user preferences. Chosen because:
- Clear functional requirements (weather display, forecast, transport times)
- Rich edge case surface (API failures, no location set, stale data, timezone handling)
- Implied requirements are non-trivial (loading states, offline handling, responsive design)
- Achievable scope for a single implementation session

## 4. Target Matrix

### Default Matrix (8 targets)

```yaml
# benchmarks/matrix.yml
benchmark:
  prd: weather-transport
  runs_per_combination: 1          # bump to 3 for statistical runs

  constant_implementer:
    harness: claude-code
    model: sonnet-4-6
    process: superpowers
    permissions: dangerously-skip-permissions

  targets:
    - id: cc-vanilla-opus
      harness: claude-code
      model: opus-4-6
      process: vanilla

    - id: cc-vanilla-sonnet
      harness: claude-code
      model: sonnet-4-6
      process: vanilla

    - id: cc-sp-opus
      harness: claude-code
      model: opus-4-6
      process: superpowers

    - id: cc-sp-sonnet
      harness: claude-code
      model: sonnet-4-6
      process: superpowers

    - id: copilot-vanilla-gpt54
      harness: copilot-cli
      model: gpt-5.4
      process: vanilla

    - id: copilot-sp-gpt54
      harness: copilot-cli
      model: gpt-5.4
      process: superpowers-equivalent

    - id: copilot-vanilla-opus
      harness: copilot-cli
      model: opus-4-6
      process: vanilla

    - id: copilot-sp-opus
      harness: copilot-cli
      model: opus-4-6
      process: superpowers-equivalent
```

### Comparison Axes

The matrix isolates three independent variables:

| Axis | Comparison | Question |
|------|-----------|----------|
| **LLM** | Opus vs Sonnet vs GPT 5.4 | Does the model matter for spec quality? |
| **Process** | Vanilla vs Superpowers-equivalent | Does structured workflow improve specs? |
| **Harness** | Claude Code vs Copilot CLI | Does the development tool matter? |

### Target Adapters

Each harness gets an adapter script that normalizes the interface:

```
benchmarks/adapters/
├── claude-code.sh
├── copilot-cli.sh
└── adapter-interface.md    # contract specification
```

Every adapter:
1. **Receives:** PRD path, spec template path, process prompt (vanilla or superpowers-equivalent), model flag
2. **Runs in an isolated directory** (fresh git repo per target per run)
3. **Runs headless** — no human approval gates, full auto mode
4. **Outputs:** `spec.md` in the standard template format
5. **Captures:** token usage, wall clock time, raw session log

### Process Prompts

```
benchmarks/prompts/
├── vanilla.md                  # "Here's a PRD. Write a spec using this template."
├── superpowers-equivalent.md   # "Analyze the PRD. Break it into components.
│                                  Identify edge cases. Consider error handling.
│                                  Then write a spec using this template."
└── spec-template.md            # Shared output template (provided to all targets)
```

### Spec Template (for equality across targets)

All targets receive the same output template:

```markdown
# Spec: [Feature Name]

## Overview
[What this feature does and why]

## Requirements
[Numbered list of functional requirements]

## Acceptance Criteria
[Testable criteria for each requirement]

## Architecture
[Component breakdown, data flow]

## Edge Cases & Error Handling
[What happens when things go wrong]

## Out of Scope
[What this feature explicitly does NOT do]
```

This ensures structural parity — we measure *content quality*, not format creativity.

## 5. Spec Generation & Iteration Loop

### Flow Per Target

```
Adapter generates spec-v0.md (original)
    │
    ▼
Speculator scores spec-v0 → scorecard-v0.yml
    │
    ├── score >= 7.8 → spec-original = v0, spec-improved = v0 (no improvement needed) ✅
    │
    └── score < 7.8
         │
         ▼
    Feed scorecard feedback to SAME adapter + LLM
    Adapter generates spec-v1.md
         │
         ▼
    Speculator scores spec-v1 → scorecard-v1.yml
         │
         ├── score >= 7.8 → spec-original = v0, spec-improved = v1 ✅
         │
         └── score < 7.8 → iterate again
              │
              ▼
         spec-v2.md → scorecard-v2.yml
              │
              ├── score >= 7.8 → spec-original = v0, spec-improved = v2 ✅
              │
              └── score < 7.8 → final iteration
                   │
                   ▼
              spec-v3.md → scorecard-v3.yml
                   │
                   └── STOP (max 3 iterations)
                        spec-original = v0, spec-improved = v3 (best effort)
```

### What Gets Sent to Implementation

**Always two specs per target:**
- `spec-original.md` — v0, the raw first attempt (unmodified)
- `spec-improved.md` — the best version after up to 3 Speculator iterations (could be v0 if it passed first try)

### Iteration Log

Each target produces an `iteration-log.yml` capturing the full improvement journey:

```yaml
target_id: cc-vanilla-opus
iterations:
  - version: v0
    scorecard: scorecard-v0.yml
    score: 6.2
    result: fail
    weakest_dimensions: [testability, edge_cases]
    tokens_consumed: 12400
    time_seconds: 34

  - version: v1
    scorecard: scorecard-v1.yml
    score: 7.1
    result: fail
    improvement_delta: +0.9
    tokens_consumed: 8200
    time_seconds: 28

  - version: v2
    scorecard: scorecard-v2.yml
    score: 7.9
    result: pass
    improvement_delta: +0.8
    tokens_consumed: 7100
    time_seconds: 25

summary:
  iterations_needed: 3
  passed: true
  original_score: 6.2
  final_score: 7.9
  total_improvement: +1.7
  total_iteration_tokens: 27700
  total_iteration_time_seconds: 87
  convergence_rate: [+0.9, +0.8]
```

### Iteration Metrics

| Metric | What it tells us |
|--------|-----------------|
| **Iterations to pass** | How much hand-holding does this LLM × process combo need? |
| **Convergence rate** | Does the score improve steadily, plateau, or oscillate? |
| **Total iteration cost** | Token + time cost of reaching a passable spec |
| **Never-passed rate** | Which combos can't reach 7.8 even after 3 tries? |
| **Improvement delta** | How much value does Speculator feedback add per round? |

## 6. Implementation Phase

### Constant Implementer

Every spec (16 total: 8 targets × 2 versions) is implemented by the same configuration:

- **Harness:** Claude Code CLI
- **Model:** Sonnet 4.6
- **Process:** Superpowers (brainstorming → writing-plans → subagent-driven-development)
- **Mode:** `--dangerously-skip-permissions` (headless, no human gates)
- **Isolation:** Fresh git repo per implementation

Since the implementer is held constant, **all variance in outcomes is attributable to spec quality**. This is the core experimental control.

### Captured Implementation Metrics

- Token consumption (in + out)
- Wall clock time
- Self-correction count (edit-test-fix cycles)
- Raw session log

## 7. Review Layer

Two layers, each measuring different things.

### Layer 1: Automated Functional Tests (Objective, Binary)

Generated from the PRD's functional checklist. For the Weather + Transport app:

```yaml
functional_checklist:
  - id: F01
    requirement: "Displays current weather for user's location"
    test: "Page contains temperature element with numeric value"
  - id: F02
    requirement: "Shows 5-day forecast"
    test: "Forecast section contains 5 day entries"
  - id: F03
    requirement: "Displays next 3 bus/train departures"
    test: "Transport panel shows departure times"
  - id: F04
    requirement: "Personalised greeting based on time of day"
    test: "Greeting text changes between morning/afternoon/evening"
```

Tests run against the built app via Playwright. Pure pass/fail per requirement. This is the **objective ground truth** — did the app do the thing?

### Layer 2: LLM-as-Judge Qualitative Review (Scored, 1-10)

The judge receives: the PRD, the spec, and the implementation source code. The judge model should differ from the constant implementer to reduce self-agreement bias — default: Claude Opus 4.6 (implementer is Sonnet 4.6). Six dimensions:

| Dimension | Weight | What it measures | Spec signal |
|-----------|--------|-----------------|-------------|
| **PRD Feature Coverage** | 0.25 | % of PRD requirements present and correct | Strong |
| **Requirement Accuracy** | 0.20 | Do implemented features behave as PRD intended? | Strong |
| **Scope Discipline** | 0.15 | Absence of unrequested features / gold-plating | Strong |
| **Edge Case Handling** | 0.15 | Error states, empty states, loading, graceful degradation | Medium |
| **Spec-to-Implementation Fidelity** | 0.15 | Does the code match what the spec described? | Strong |
| **Structural Quality** | 0.10 | Code organisation, separation of concerns, maintainability | Medium (informational) |

**Note on Structural Quality:** Included at low weight (0.10) as an informational dimension. It contributes to the composite score but is annotated with a caveat in comparative rankings — if it introduces noise during calibration, its weight can be zeroed without redesigning the rubric.

### The Correlation Metric — "Spec Effectiveness Score"

The headline metric that ties the whole benchmark together:

```
For each target × spec pair:
  - Speculator Gate-1 Score (spec quality, 1-10)
  - Benchmark Outcome Score (implementation quality, 1-10, from Layer 2)

Correlation(Gate-1, Outcome) = Spec Effectiveness Score
```

Interpretation:
- **High spec score, high outcome score** — Good spec, implementer followed it. Validates pipeline.
- **High spec score, low outcome score** — Spec looked good but wasn't implementable (feasibility gap).
- **Low spec score, high outcome score** — Implementer compensated for spec gaps (undermines spec thesis).
- **Low spec score, low outcome score** — Bad spec, bad outcome. Validates pipeline.

If the correlation is strong, **Speculator's rubric is predictive**. If it's weak, we need to recalibrate weights.

## 8. Stochastic Variance Handling

LLMs are non-deterministic. The harness supports configurable `runs_per_combination`:

- **First run (validation):** 1 run per combination (16 implementations). Validates the harness works end-to-end, gives directional signal.
- **Statistical run:** 3 runs per combination (48 implementations). Mean + variance per combination. More rigorous, 3× cost.
- **Future:** N configurable per `matrix.yml`.

**Variance as a signal:** When running 3× per combination, high spread across runs for the same spec = the spec left too much to interpretation. Low spread = the spec was clear enough that outcomes converge. **Implementation variance becomes a spec clarity metric.**

## 9. Calibration Protocol

The LLM-as-judge review layer must be validated before trusting at scale.

### First-Run Calibration

On the very first benchmark run:

1. **Human reviews 3-4 implementations** — spread across the quality spectrum (one likely-good, one likely-bad, one middle)
2. **Human fills out the same 6-dimension scorecard** the judge uses
3. **Run the LLM-as-judge** on those same implementations
4. **Compare scores** — if human and judge agree within ±1.0 per dimension, the judge is calibrated
5. **If they diverge** — examine which dimensions diverge, tune the rubric prompt, re-run until alignment

### Calibration Artifact

```yaml
# benchmarks/calibration/calibration-001.yml
prd: weather-transport
date: 2026-04-XX
implementations_reviewed:
  - id: cc-sp-opus-original
    human_scores: { prd_feature_coverage: 9, requirement_accuracy: 8, ... }
    judge_scores: { prd_feature_coverage: 9, requirement_accuracy: 8, ... }
    max_divergence: 1.0
    calibrated: true
rubric_version: 1.0
result: calibrated
notes: "Edge case dimension consistently 1 point generous — tightened rubric language"
```

### Recalibration Triggers

- New PRD added to the library
- Major rubric revision
- New model used as judge

## 10. Output Structure

### Directory Layout Per Run

```
benchmarks/runs/{run-id}/
├── config.yml                              # Frozen matrix + settings
├── prd.md                                  # Frozen PRD copy
│
├── specs/
│   ├── cc-vanilla-opus/
│   │   ├── spec-v0.md                      # Original spec
│   │   ├── scorecard-v0.yml                # Speculator score
│   │   ├── spec-v1.md                      # Iteration 1 (if needed)
│   │   ├── scorecard-v1.yml
│   │   ├── spec-improved.md                # Symlink → best version
│   │   ├── iteration-log.yml               # Full iteration history
│   │   └── session-log.txt                 # Raw LLM session
│   ├── cc-sp-sonnet/
│   │   └── ...
│   └── .../
│
├── implementations/
│   ├── cc-vanilla-opus-original/
│   │   ├── app/                            # The built application
│   │   ├── functional-results.yml          # Layer 1 test results
│   │   ├── judge-scorecard.yml             # Layer 2 LLM-as-judge scores
│   │   ├── metrics.yml                     # Tokens, time, iterations
│   │   └── session-log.txt                 # Raw implementation session
│   ├── cc-vanilla-opus-improved/
│   │   └── ...
│   └── .../
│
├── report.yml                              # Machine-readable comparative data
├── report.html                             # Visual dashboard
└── calibration/
    └── calibration-001.yml                 # If calibration was performed
```

### Comparative Report (`report.yml`)

```yaml
run_id: bench-2026-04-15-001
prd: weather-transport
runs_per_combination: 1
timestamp: 2026-04-15T14:30:00Z

rankings:
  - rank: 1
    target: cc-sp-opus
    spec_version: improved
    speculator_score: 8.7
    outcome_score: 9.1
    functional_pass_rate: 15/15
    iterations_to_pass: 0
    total_tokens: 45000
    total_time_seconds: 312

  - rank: 2
    target: copilot-sp-opus
    spec_version: improved
    speculator_score: 8.2
    outcome_score: 8.4
    functional_pass_rate: 14/15
    iterations_to_pass: 1
    total_tokens: 52000
    total_time_seconds: 380
  # ... all 16 entries

correlations:
  speculator_score_vs_outcome: 0.84     # Pearson r
  iteration_count_vs_outcome: -0.62
  original_vs_improved_delta: +1.3      # Average outcome improvement

axis_analysis:
  llm_effect:
    opus_vs_sonnet: +0.8
    opus_vs_gpt54: +0.3
  process_effect:
    superpowers_vs_vanilla: +1.2
  harness_effect:
    claude_code_vs_copilot: +0.4

insights:
  - "Superpowers-equivalent process had the largest single-axis effect (+1.2)"
  - "Speculator score is strongly predictive of outcome (r=0.84)"
  - "Original → improved spec iteration improved outcomes by avg +1.3"
```

### Visual Dashboard (`report.html`)

An HTML report showing:
- **Leaderboard** — ranked table of all implementations
- **Correlation scatter plot** — Speculator score (x) vs Outcome score (y)
- **Axis breakdown** — bar charts for LLM effect, process effect, harness effect
- **Improvement waterfall** — original vs improved scores per target
- **Iteration patterns** — convergence curves per target
- **Functional test heatmap** — which PRD features each implementation nailed or missed

## 11. CLI Interface

```bash
# Run the full benchmark
speculator benchmark run --prd weather-transport --matrix default.yml --runs 1

# Run with statistical repeats
speculator benchmark run --prd weather-transport --matrix default.yml --runs 3

# Generate report from existing run data
speculator benchmark report --run bench-2026-04-15-001

# Run calibration (human-in-the-loop)
speculator benchmark calibrate --run bench-2026-04-15-001

# List available PRDs
speculator benchmark prds

# Add a new PRD to the library
speculator benchmark add-prd --path ./my-prd.md
```

## 12. Directory Structure in Speculator Repo

```
speculator/
├── benchmarks/
│   ├── README.md                    # Benchmark documentation
│   ├── cli.sh                       # Main CLI entrypoint
│   ├── adapters/
│   │   ├── adapter-interface.md     # Adapter contract
│   │   ├── claude-code.sh
│   │   └── copilot-cli.sh
│   ├── prompts/
│   │   ├── vanilla.md
│   │   ├── superpowers-equivalent.md
│   │   └── spec-template.md
│   ├── rubrics/
│   │   └── outcome-rubric.md        # LLM-as-judge review rubric
│   ├── prds/
│   │   └── weather-transport/
│   │       ├── prd.md
│   │       └── functional-tests.yml
│   ├── calibration/                  # Calibration artifacts
│   ├── matrix/
│   │   └── default.yml              # Default target matrix
│   └── runs/                         # Run output (gitignored)
│       └── bench-YYYY-MM-DD-NNN/
├── ... (existing speculator structure)
```

## 13. Success Criteria

The benchmark is successful if it can answer:

1. **Is Speculator score predictive?** — Pearson correlation between Gate-1 score and outcome score is r >= 0.6 (moderate-to-strong).
2. **Does iteration help?** — Improved specs produce measurably better outcomes than originals (paired t-test, p < 0.05 with N=3 runs).
3. **Does process matter?** — Superpowers-equivalent targets score higher than vanilla on both spec quality and outcome quality.
4. **Is it reusable?** — A second benchmark run with a different PRD can be executed with only `speculator benchmark run --prd new-prd --matrix default.yml`.

## 14. Out of Scope

- **Scoring the implementer** — Spec-Bench measures spec effectiveness, not Claude Code vs Copilot as code generators. The implementer is held constant deliberately.
- **Live API integrations** — The Weather + Transport PRD uses mock data / stub APIs. No real weather API keys needed.
- **Continuous integration** — Spec-Bench is run on-demand, not as part of CI. Future work may add scheduled runs.
- **Multi-session implementations** — Each implementation must complete in a single headless session.
- **Human spec writers** — v1 tests LLM-generated specs only. Human-written specs as a baseline is future work.

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| LLM-as-judge agrees with itself (marking own homework) | Inflated scores, invalid correlations | Calibration protocol with human baseline; automated functional tests as objective floor |
| Copilot CLI lacks headless auto-approve mode | Can't run Copilot targets unattended | Research during implementation; worst case, reduce matrix to Claude Code targets only |
| Stochastic variance swamps signal | Can't distinguish spec quality from LLM randomness | 3× runs with mean/variance; variance itself becomes a metric |
| PRD too simple — all specs pass easily | No differentiation between targets | PRD designed with implied requirements and ambiguous areas; difficulty tunable |
| Structural Quality dimension adds noise | Distorts rankings | Low weight (0.10) + caveat annotation; can zero out during calibration |
| Cost of 48 implementation runs (3× statistical) | Expensive | Start with 1× validation run; only run 3× once harness is proven |
