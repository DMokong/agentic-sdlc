# Phase 2: Plan Creation

1. **Invoke the `writing-plans` skill** with the approved spec path. The plan is saved to `docs/plans/YYYY-MM-DD-{feature-name}.md`.

2. **Create beads user stories** from plan tasks:
   - For each task in the plan, create a beads issue:
     ```bash
     beads create --title "Task N: {task_title}" \
       --description "{task_description}" --priority P2
     ```
   - Link each story to the spec's epic (from spec frontmatter `epic` field):
     ```bash
     beads dep add {story-id} --blocked-by {epic-id}
     ```

3. **Guided + interactive mode** → Present the plan summary, then ask:
   ```
   AskUserQuestion: "Plan created with N tasks. Approve and continue to implementation? (y/n)"
   ```
   - If rejected, stop and let the user revise.

4. **Guided + headless mode** → Commit the plan, output review instructions, exit with code 0:
   ```
   Plan committed. Review at: docs/plans/{plan-file}
   To continue: /sdlc run
   ```

5. **Full Auto mode** → Commit and proceed to Phase 3 without pausing.

6. **Commit** plan + stories:
   ```
   chore(sdlc): phase 2 — plan created with N tasks
   ```
