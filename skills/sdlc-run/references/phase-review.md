# Phase 4: Code Review (Gate 3)

1. **Dispatch the `code-reviewer` agent** from `${CLAUDE_PLUGIN_ROOT}/agents/code-reviewer/AGENT.md` with:
   - Spec path
   - Plan path
   - Worktree base directory
   - Output path: `{spec_dir}/{spec_name}/evidence/gate-3-review.yml`

2. **If blocking issues found** → one self-fix cycle:
   1. Read the blocking issues from `gate-3-review.yml`.
   2. Address each blocking issue in the code.
   3. Re-dispatch the `code-reviewer` agent to produce a fresh review.

3. **If still blocking after self-fix** → escalate to human:
   ```
   Gate 3 (code review) found blocking issues that persist after auto-fix:
   {blocking_issues}
   Manual intervention needed.
   ```

4. **Commit** evidence:
   ```
   chore(sdlc): gate 3 — code review {pass|fail}
   ```
