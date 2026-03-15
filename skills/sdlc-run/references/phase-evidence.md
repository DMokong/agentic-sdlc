# Phase 5: Evidence Package & Merge (Gate 4)

1. **Guided + interactive mode** → Present a summary of all work before proceeding:
   ```
   Pipeline Summary:
     Spec:           {spec_title} ({spec_id})
     Trust mode:     {autonomy_mode} (score: {trust_score})
     Gate 1 (spec):  pass ({score})
     Gate 2 (code):  pass
     Gate 3 (review): pass
     Plan:           {N} tasks completed
     Stories:        {N} closed
   ```
   Then ask:
   ```
   AskUserQuestion: "All gates passed. Approve and merge to main? (y/n)"
   ```
   - If rejected, stop and let the user review.

2. **Guided + headless mode** → Commit everything, output review instructions, exit:
   ```
   All gates passed. Evidence committed.
   To merge: git checkout main && git merge {branch}
   Or run /sdlc run again in interactive mode to approve the merge.
   ```

3. **Full Auto mode** → Proceed with merge automatically.

4. **Invoke `gate-check`** with `gate=evidence-package` → produces `evidence/gate-4-summary.yml`.

5. **Close beads issues**:
   - Find all stories linked to the epic: `beads dep list {epic-id}`
   - Close each completed story: `beads close {story-id}`
   - Close the epic: `beads close {epic-id}`

6. **Remove the `.active` lock file**:
   ```bash
   rm docs/specs/{spec-name}/.active
   ```

7. **Commit** all evidence:
   ```
   chore(sdlc): gate 4 — evidence package complete
   ```

8. **Merge** the worktree branch to main:
   ```bash
   git checkout main
   git merge {worktree-branch}
   ```

9. **Compact into system spec:**
   - After merge lands on main, invoke the `spec-compactor` agent from `${CLAUDE_PLUGIN_ROOT}/agents/spec-compactor/AGENT.md` with:
     - `spec_path`: path to the closing spec
     - `system_spec_path`: `{spec_dir}/SYSTEM-SPEC.md`
   - Update spec frontmatter: `status: compacted`, `compacted_into: SYSTEM-SPEC`, `compacted_date: {today}`
   - Commit: `chore(sdlc): compact {spec_id} into SYSTEM-SPEC.md`
   - If compaction fails, warn but do not block — the spec remains `closed` (valid but not yet folded into system spec)
