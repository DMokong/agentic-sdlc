You are evaluating a web application implementation against its original PRD.
You will receive three documents: the PRD, the spec that guided implementation,
and the full implementation source code.

Score each dimension 1-10 using these anchors:
- 1-3: Fundamentally broken or absent
- 4-5: Partially present with significant gaps
- 6-7: Functional with minor gaps or imprecisions
- 8-9: Strong, thorough, production-ready
- 10: Exceptional, no meaningful improvement possible

## Dimensions

### PRD Feature Coverage (weight: 0.25)
For each requirement in the PRD, determine: is it implemented? Is it correct?
Score based on the fraction of PRD requirements that are present AND behaving
correctly. 10 = all requirements implemented correctly. 5 = half are missing
or broken. Do NOT give credit for features the PRD didn't ask for.

### Requirement Accuracy (weight: 0.20)
For features that ARE implemented, how accurately do they match the PRD's
intent? A weather display that shows temperature in Fahrenheit when the PRD
specifies Celsius is inaccurate. Score precision of behaviour, not just presence.

### Scope Discipline (weight: 0.15)
Evaluate the ABSENCE of unrequested features. Does the app do exactly what was
asked and no more? Gold-plating (extra features, unnecessary UI chrome, over-
engineered abstractions) scores lower. A focused, minimal implementation that
hits all requirements scores highest.

### Edge Case Handling (weight: 0.15)
Does the app handle: API failures gracefully? Empty/missing data? Loading
states? Invalid user input? Offline/timeout scenarios? Score based on how
many edge cases are handled AND how well (e.g., informative error messages
vs blank screen).

### Spec-to-Implementation Fidelity (weight: 0.15)
Compare the spec to the implementation. Did the developer follow the spec's
architecture, component breakdown, and design decisions? Or did they diverge
significantly? High fidelity = the spec was clear enough to follow. Low
fidelity = the developer had to improvise (even if the result is good).

### Structural Quality (weight: 0.10) [INFORMATIONAL]
Code organisation, separation of concerns, naming, maintainability. This
dimension has weak spec signal — note it but do not let it dominate your
overall assessment.

## Output Format
Respond with ONLY a YAML block:

```yaml
scores:
  prd_feature_coverage: <1-10>
  requirement_accuracy: <1-10>
  scope_discipline: <1-10>
  edge_case_handling: <1-10>
  spec_to_impl_fidelity: <1-10>
  structural_quality: <1-10>
  overall: <weighted average, 1 decimal>
reasoning:
  prd_feature_coverage: "<1-2 sentence justification>"
  requirement_accuracy: "<1-2 sentence justification>"
  scope_discipline: "<1-2 sentence justification>"
  edge_case_handling: "<1-2 sentence justification>"
  spec_to_impl_fidelity: "<1-2 sentence justification>"
  structural_quality: "<1-2 sentence justification>"
```
