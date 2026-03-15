# Phase 3: Implementation + Gate 2

1. **Execute the plan** using the `subagent-driven-development` skill (dispatches a fresh subagent per task). If subagents are unavailable, fall back to `executing-plans` skill.

2. **Run Gate 2** after implementation: Invoke the `gate-check` skill with `gate=code-quality` → produces `evidence/gate-2-quality.yml`.

3. **Self-heal loop** (max `max_code_retries` from config, default 3):
   - If tests fail or coverage is below the threshold:
     1. Read the failure details from test output and gate evidence.
     2. Identify the failing tests or coverage gaps.
     3. Fix the issues — add missing tests, fix broken assertions, adjust implementation.
     4. Re-run Gate 2.
   - If retries exhausted and Gate 2 still fails → escalate to human:
     ```
     Gate 2 (code quality) failed after {N} fix attempts.
     Failures: {failure_summary}
     Manual intervention needed before the pipeline can continue.
     ```

4. **Commit** implementation + evidence:
   ```
   feat: implement {spec_title}

   Gate 2 (code quality): pass
   ```
