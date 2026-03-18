# Phase 5: Evidence Package & Deliver (Gate 4)

Read `close.strategy` from the project config (`.claude/sdlc.local.md`). Default is `merge` if not set.

## Steps 1–7: Common to both strategies

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
     Delivery:       {close_strategy} (merge or pr)
   ```
   Then ask:
   ```
   AskUserQuestion: "All gates passed. Approve and {merge to main / create PR}? (y/n)"
   ```
   - If rejected, stop and let the user review.

2. **Guided + headless mode** → Commit everything, output review instructions, exit:
   - If strategy is `merge`:
     ```
     All gates passed. Evidence committed.
     To merge: git checkout main && git merge {branch}
     Or run /sdlc run again in interactive mode to approve the merge.
     ```
   - If strategy is `pr`:
     ```
     All gates passed. Evidence committed.
     To create PR: gh pr create --base main
     Or run /sdlc run again in interactive mode to create the PR.
     ```

3. **Full Auto mode** → Proceed with delivery automatically (merge or PR based on strategy).

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

## Step 8–9: Strategy-dependent delivery

### Strategy: `merge` (default)

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

### Strategy: `pr`

8. **Create a pull request**:
   a. Push the branch to the remote:
      ```bash
      git push -u origin {worktree-branch}
      ```
   b. Build the PR body from gate evidence:
      - Read `gate-4-summary.yml` for the pipeline result
      - Read the spec's title, problem statement, and acceptance criteria
      - Read `gate-1-scorecard.yml` for the spec quality score
      - Compose a PR description with:
        - **Summary**: spec title and 1-2 sentence problem statement
        - **Spec quality**: overall score from Gate 1
        - **Evidence**: table showing all 4 gates and their results
        - **Acceptance criteria**: list from the spec
        - Footer: `🔬 Quality pipeline: Speculator`
   c. Create the PR:
      ```bash
      gh pr create --title "{spec_title}" --body "{composed body}" --base main
      ```
   d. Report the PR URL.

9. **Defer compaction**: Compaction requires the spec to be on main. Output:
   *"Compaction into SYSTEM-SPEC.md is deferred — run `/spec compact {spec-name}` after the PR is merged to main."*
   The worktree stays active until the PR merges.
