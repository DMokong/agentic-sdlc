# Anti-Dark-Code Pipeline Expansion — Design Doc

**Date:** 2026-04-15
**Author:** Dustin Cheng
**Status:** Approved for implementation planning
**Phases:** Phase 1 (Gate 2b — Eval Quality), Phase 2 (Gate 2c — Comprehension Gate)

---

## Problem Statement

Speculator currently catches spec quality problems (Gate 1) and verifies tests pass (Gate 2), but two gaps remain open that enable "dark code" — production software that was generated, passed automated checks, and shipped without anyone understanding what it does or whether its tests are trustworthy:

1. **Eval quality gap:** Gate 2 verifies tests pass. It never asks: *are the tests good instruments of the spec?* A test suite can achieve 100% pass rate while systematically testing implementation artifacts rather than specified behaviors. When the implementation changes in a spec-compliant way, these tests break for the wrong reason — or worse, they pass when the behavior is wrong.

2. **Comprehension gap:** No gate requires that the implementation can be explained in terms of the spec. Code can satisfy every written AC, pass every test, and still miss the intent of what was asked. Jones (NBJ Substack, Apr 2026) calls this "dark code" — the Amazon case study: 80% AI coding mandate + 16K engineer layoffs → Kiro deletes an entire environment → 13 hours of downtime. The crisis wasn't the tool; it was the elimination of the humans who *understood* what the tool was touching.

**The fix:** Two new opt-in gates that close the pathway between "tests pass" and "code ships."

---

## Architecture

The updated pipeline:

```
Gate 1:  Spec Quality          → Is the spec good enough to build from?
Gate 2:  Code Quality          → Do the tests pass? Does coverage meet threshold?
Gate 2b: Eval Quality [opt-in] → Are the tests good instruments of the spec?
Gate 2c: Comprehension [opt-in] → Can the implementation be explained in spec terms?
Gate 3:  Code Review           → Is the code well-written?
Gate 4:  Evidence Package      → Is everything documented and mergeable?
```

**Ordering rationale:**
- 2b before 2c: know whether your tests are trustworthy before you explain what the code does
- Both before Gate 3: the code reviewer receives comprehension artifacts as context, making review richer without re-deriving it
- Both opt-in: enabled per-project via `sdlc.local.md`; default off to preserve existing behavior

**Dark code prevention mapping:**
- Jones's "spec-driven development" → Gate 1 (exists)
- Jones's "context engineering" → Gate 2c artifact (durable context, not just a gate)
- Jones's "comprehension gate" → Gate 2c

The comprehension artifact produced by Gate 2c has dual value: as a gate it catches dark code; as an artifact it answers "why was this written this way?" for the next developer or agent months later.

---

## Gate 2b — Eval Quality Scoring

### What It Checks

Whether each test is a *faithful instrument* for detecting deviation from its mapped AC. Not "does this test pass" (Gate 2's job) but "if the behavior described in this AC broke, would this test catch it?"

The abstraction layer is **AC-to-behavior fidelity** — positioned at behavioral claims rather than test idioms. This works uniformly across Playwright, pytest, shell scripts, and any future framework, because the judge is reasoning about what behavior is being asserted, not how the assertion is expressed.

### Scoring Rubric — 7 Dimensions

| # | Dimension | Scoring method | Weight |
|---|-----------|---------------|--------|
| 1 | AC Coverage | Deterministic + LLM quality overlay | 0.25 |
| 2 | Behavioral Specificity | LLM judge | 0.25 |
| 3 | Intent Fidelity | LLM judge | 0.20 |
| 4 | Sensitivity / Discriminability | LLM judge | 0.15 |
| 5 | Scenario Completeness | LLM judge | 0.10 |
| 6 | Assertion Density | Deterministic | 0.03 |
| 7 | Test Independence | Deterministic + LLM | 0.02 |

**Dimension 1 — AC Coverage (0.25)**
Not just that a test exists for each AC, but that the mapping has quality. Score scale: 1 = multiple ACs unmapped; 5 = all ACs have a named test; 8 = all ACs have a test with observable assertion; 10 = all ACs have a test + description connecting test intent to AC intent.

**Dimension 2 — Behavioral Specificity (0.25)**
Does each test verify a behavior described in the AC, or an incidental implementation artifact? Anti-patterns: asserting internal/private state, call counts on mocks without behavioral motivation, asserting class names or module paths. Good signal: assertions are at the system's public interface or observable output; the test would fail if the AC's behavior broke even if the implementation changed.

**Dimension 3 — Intent Fidelity (0.20)**
Does the test capture the *spirit* of the AC, not just the letter? Example: AC says "Users can delete their account." Test asserts `HTTP 200 on DELETE /account` → letter only. Test asserts account is unreachable afterward and data is purged → spirit. Key question: if the implementation satisfied every line of this test but violated the underlying intent of the AC, would the test still pass?

**Dimension 4 — Sensitivity / Discriminability (0.15)**
Would this test fail if the specified behavior broke? Not "would it catch any bug" but "would it catch a bug that violates this specific AC?" A test that always passes regardless of input scores 1. A test with a precise expected output that would fail on a plausible AC-violating behavior scores 9.

**Dimension 5 — Scenario Completeness (0.10)**
An AC often implies multiple scenarios — happy path plus error conditions. Does the test suite cover the scenario space the AC implies, not just the headline case?

**Dimension 6 — Assertion Density (0.03)**
Does each test have substantive assertions, or does it just run the code? Tests with zero assertions or only `assertNotNull`/`toBeTruthy`-style presence checks have trivially low discriminability.

**Dimension 7 — Test Independence (0.02)**
Do tests share state in ways that could produce false positives? Deterministic check for global state mutation; LLM judgment on whether test order matters.

### Judge Design

**Context package (minimum viable):**
1. Spec problem statement (2–3 sentences)
2. The specific AC being evaluated (full text)
3. The test's assertions — stripped of setup, mocks, teardown where possible
4. Test name/description if present

**Critical judge instruction:** "Assume the implementation is correct. Evaluate only whether this test is a faithful instrument for detecting deviation from the AC."

**MVP caveat:** Assertions-only extraction is non-trivial for Playwright (assertions are interleaved with actions). MVP passes full test code with explicit "focus on assertions" instruction. Known limitation; improve with calibration data.

**Calibration requirement:** 15–20 scored examples per dimension before the rubric is production-ready. This is the primary build cost. Without calibration examples, the LLM judge drifts.

### Gate Decision

Passes when:
1. Overall score >= 6.5 (lower than Gate 1's 7.0 — eval quality is harder to achieve on first pass)
2. Every dimension >= 4
3. No blocking flags

### Evidence Artifact

`docs/specs/{name}/evidence/gate-2b-eval-quality.yml`

```yaml
gate: eval-quality
spec_id: SPEC-NNN
timestamp: 2026-04-15T10:00:00Z
dimensions:
  ac_coverage: 7.5
  behavioral_specificity: 6.0
  intent_fidelity: 6.5
  sensitivity: 7.0
  scenario_completeness: 5.5
  assertion_density: 8.0
  test_independence: 9.0
overall: 6.7
threshold: 6.5
result: pass
flags:
  blocking: []
  recommended:
    - "AC3 test only asserts HTTP 200, not that data was actually deleted"
  advisory: []
```

### Implementation Surface

- New agent: `agents/eval-quality-scorer/AGENT.md`
- New rubric: `rubrics/eval-quality.md`
- `gate-check` skill: add `gate=eval-quality` routing
- `sdlc-run` phase detection: new row between Gate 2 and Gate 3

---

## Gate 2c — Comprehension Gate

### What It Checks

Whether the implementation can be explained in terms of the spec. Not "is the code good" (Gate 3's job) but "does the code demonstrably do what the spec asked for?" This is Jones's comprehension gate translated from "a human must explain it" to "a comprehension artifact must exist and score above threshold."

The gate has dual value:
- **As a gate:** catches dark code — implementations that satisfy tests while missing spec intent
- **As an artifact:** durable context. The comprehension entries answer "why was this written this way?" for future developers and agents. This is Jones's "context engineering" layer operationalized.

### Process (Two Phases, One Agent)

A single comprehension agent handles both generation and scoring — it reads the spec + diff cold, generates the artifact, then scores it. The two phases are described separately for clarity; there is no handoff between agents.

**Phase 1 — Generate comprehension artifact**

A dedicated comprehension agent reads the spec + git diff *cold* (no access to the implementing agent's reasoning). This separation is intentional: the implementing agent cannot be its own judge. The agent produces a per-AC comprehension artifact:

```yaml
comprehension_entries:
  - ac_id: AC1
    ac_text: "Given a PNG file <5MB, when detected in tool output, then upload to active thread"
    implementation_summary: >
      Handled in upload-detector.ts:detectImages(). Checks tool_result blocks for
      file paths matching PNG/JPG/GIF extensions. Calls slack-uploader.ts:uploadToThread()
      with channel_id and thread_ts from context. Returns upload confirmation object.
    code_locations:
      - file: src/upload-detector.ts
        function: detectImages
      - file: src/slack-uploader.ts
        function: uploadToThread
    coverage: full
    gap_notes: ""

  - ac_id: AC3
    ac_text: "Given an expired bot token, when upload attempted, then 401 logged and processing continues"
    implementation_summary: >
      try/catch in upload-handler.ts:processUpload() catches Slack 401 errors.
      Logs "Token expired, skipping upload" and returns null, allowing caller to continue.
    code_locations:
      - file: src/upload-handler.ts
        function: processUpload
    coverage: partial
    gap_notes: "Logs the error but doesn't emit a metric — spec intent implies observability"

unexplained_behaviors:
  - description: "upload-detector.ts also checks .webp extension — not mentioned in any AC"
    file: src/upload-detector.ts
    line_range: "47-49"
    concern: scope_creep
```

**Phase 2 — Score the artifact**

The same agent then evaluates the artifact it generated against the spec + diff:

### Scoring Rubric — 4 Dimensions

| Dimension | Weight | What it catches |
|-----------|--------|-----------------|
| AC Coverage | 0.30 | Every AC mapped with a substantive, non-trivial entry |
| Accuracy | 0.30 | Does the explanation actually match the code? (judge sees diff + artifact) |
| Intent Alignment | 0.25 | Does the described behavior match the spec's intent, not just letter? |
| Scope Containment | 0.15 | Unexplained behaviors = scope creep or dark code pockets |

**AC Coverage (0.30)**
Every AC has a comprehension entry. Entries must be substantive — not "handled somewhere" but a specific explanation with code locations. Partially-covered or missing ACs are flags.

**Accuracy (0.30)**
Does the explanation match the actual code? The judge receives both the comprehension artifact and the relevant diff sections. Inaccurate explanations — where the description doesn't match what the code actually does — are a blocking flag. An inaccurate explanation is worse than no explanation (false confidence).

**Intent Alignment (0.25)**
Does the described behavior match what the spec was actually asking for? The canonical example: spec says "delete account," implementation does soft-delete, test passes because it checks HTTP 200. The explanation describes soft-delete accurately. Intent Alignment scores low because the spec's intent ("data gone") isn't met. This is the dark code detector.

**Scope Containment (0.15)**
Unexplained implementation behaviors — code in the diff not covered by any AC — are flagged. Minor utilities score low-concern. Significant behavior additions score as blocking. This is scope creep detection at the implementation level.

### Judge Context

The judge for Gate 2c needs: spec ACs + spec problem statement + git diff (trimmed to changed files) + comprehension artifact. The diff is necessary to score Accuracy — the judge must verify the explanation is truthful.

**Critical judge instruction:** "You are evaluating whether this explanation is accurate and whether the implementation does what the spec intended. Do not evaluate code quality — that is Gate 3's job."

### Gate Decision

Passes when:
1. Overall score >= 7.0
2. Every dimension >= 5
3. No blocking flags

Blocking flags:
- Any AC marked `coverage: missing` without a documented justification
- Any Accuracy issue where the explanation demonstrably contradicts the code
- Any unexplained behavior scored `scope_creep` (not just `minor_utility`)

### Evidence Artifact

`docs/specs/{name}/evidence/gate-2c-comprehension.yml`

```yaml
gate: comprehension
spec_id: SPEC-NNN
timestamp: 2026-04-15T10:00:00Z
comprehension_entries:
  - ac_id: AC1
    coverage: full
    gap_notes: ""
  - ac_id: AC3
    coverage: partial
    gap_notes: "Logs error but doesn't emit a metric — spec intent implies observability"
unexplained_behaviors:
  - description: "upload-detector.ts checks .webp — not in any AC"
    file: src/upload-detector.ts
    line_range: "47-49"
    concern: scope_creep
dimensions:
  ac_coverage: 7.0
  accuracy: 8.0
  intent_alignment: 6.5
  scope_containment: 5.5
overall: 7.0
threshold: 7.0
result: pass
flags:
  blocking: []
  recommended:
    - "AC3 partial coverage: observability gap should be addressed or deferred explicitly"
  advisory:
    - ".webp support should be added to spec out-of-scope section or promoted to an AC"
```

### Downstream Use in Gate 3

Gate 3 (code review) receives the comprehension artifact as context. The reviewer agent reads it before running the review. This means the reviewer doesn't need to re-derive "what does this code do" from scratch — they enter review already knowing which ACs are fully/partially covered and where the code lives. Review becomes richer and faster.

### Implementation Surface

- New agent: `agents/comprehension-scorer/AGENT.md` (generates artifact and scores in one pass)
- New rubric: `rubrics/comprehension.md`
- `gate-check` skill: add `gate=comprehension` routing
- `sdlc-run` phase detection: new row between Gate 2b and Gate 3
- Gate 3 skill: read comprehension artifact as reviewer context preamble

---

## `sdlc-run` Phase Detection Updates

The phase detection table in `skills/sdlc-run/SKILL.md` gains two new rows:

| Check | Condition | Phase to start |
|-------|-----------|----------------|
| 3a | Gate 2 exists, `eval-quality.enabled: true`, no `gate-2b-eval-quality.yml` | Gate 2b: Eval Quality |
| 3b | Gate 2b exists (or disabled), `comprehension.enabled: true`, no `gate-2c-comprehension.yml` | Gate 2c: Comprehension |

When either optional gate is enabled but fails, the pipeline stops with the same blocking behavior as any other gate failure. The spec can be re-submitted once the underlying issues are addressed (improve tests for 2b, clarify implementation for 2c).

---

## Configuration

In `.claude/sdlc.local.md`:

```yaml
gates:
  eval-quality:
    enabled: false          # opt-in
    threshold: 6.5
    per_dimension_minimum: 4
  comprehension:
    enabled: false          # opt-in
    threshold: 7.0
    per_dimension_minimum: 5
```

Both default off. Recommended adoption path: enable `eval-quality` first (rubric more mature, research complete), then `comprehension` once calibration examples are built.

---

## Implementation Phases

### Phase 1 — Gate 2b: Eval Quality (ship first)

Research is complete. The rubric is designed. Main build cost is calibration examples.

Deliverables:
1. `rubrics/eval-quality.md` — full rubric with calibration examples (15–20 per dimension)
2. `agents/eval-quality-scorer/AGENT.md` — agent that reads spec + tests, scores against rubric, emits YAML artifact
3. `gate-check` skill update — add `gate=eval-quality` routing, evidence read/write
4. `sdlc-run` phase detection update — insert 2b check between Gate 2 and Gate 3
5. `sdlc.local.md` schema update — add `gates.eval-quality` block
6. `spec-template.md` update — add note on AC traceability to test names (feeds Dimension 1)

### Phase 2 — Gate 2c: Comprehension Gate (after Phase 1 ships)

Depends on Phase 1 learnings (calibration workflow, agent patterns). Comprehension rubric requires its own calibration dataset.

Deliverables:
1. `rubrics/comprehension.md` — full rubric with calibration examples (10–15 per dimension; fewer dimensions)
2. `agents/comprehension-scorer/AGENT.md` — agent that reads spec + diff cold, generates artifact, scores, emits YAML
3. `gate-check` skill update — add `gate=comprehension` routing
4. `sdlc-run` phase detection update — insert 2c check between 2b and Gate 3
5. Gate 3 skill update — preamble to read comprehension artifact as reviewer context
6. `sdlc.local.md` schema update — add `gates.comprehension` block

---

## Risks and Open Questions

1. **Calibration is the critical path.** Both gates need scored examples before the LLM judge is reliable. Without calibration, scores drift. Phase 1 ships when `rubrics/eval-quality.md` has calibration examples, not when the agent code is written.

2. **Playwright assertions extraction (Phase 1).** MVP passes full test code; known limitation. Calibration examples should explicitly include Playwright tests so the judge learns to focus on `expect()` calls.

3. **AC ambiguity amplification (Phase 1).** Vague ACs produce unreliable Gate 2b scores. The correlation between Gate 1 Testability scores and Gate 2b overall scores is worth tracking — high correlation validates the thesis that spec quality predicts eval quality.

4. **Comprehension artifact accuracy risk (Phase 2).** A confidently wrong explanation is worse than no explanation. The Accuracy dimension is the most important check. Calibration examples must include cases where the explanation looks plausible but contradicts the diff.

5. **Gaming (both gates).** Teams aware of the judge's criteria might add behavioral wrapper language without substance. Calibration examples that explicitly identify gaming patterns help. Gate 2b Dimension 4 (Sensitivity) is a natural gaming detector — a gamed test often fails sensitivity because the added behavioral assertion is vacuous.

6. **Spec-Bench validation opportunity.** Run Gate 2b scores against mutation testing (Stryker/Pitest) on the same suites. High Gate 2b scores should predict high kill rates on AC-relevant mutations. Testable hypothesis.

---

## Key Sources

- Nate B Jones, "Your Codebase Is Full of Code Nobody Understood" (Apr 2026) — dark code taxonomy, comprehension gate concept
- Eval Quality Scoring Research (`docs/plans/2026-04-10-eval-quality-scoring-research.md`) — full rubric design, prior art survey, judge design rationale
- Barr et al., "The Oracle Problem in Software Testing" (IEEE TSE 2014) — AC-to-behavior fidelity theoretical foundation
- Intent-Based Mutation Testing (ICST Mutation 2025) — academic analog to Gate 2b
