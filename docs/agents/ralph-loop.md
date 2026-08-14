# Ralph Loop integration

Ralph is an execution engine. Local Markdown issues remain the planning source of truth.

## Generate the runnable queue

From the repository root:

    node scripts/ralph-tasks.mjs generate .scratch/reusable-label-printing

The helper writes Ralph's task index and detailed task specifications under `.agent/`. It:

- reads `ready-for-agent` Markdown issues;
- splits each checklist acceptance criterion into one Ralph task;
- preserves completed task state when regenerating;
- orders tasks by issue dependencies;
- excludes work with unresolved blockers outside the runnable issue graph;
- records excluded work in `.agent/blocked-issues.json`.

Review every generated task before running Ralph. Generation is deterministic but cannot replace human review of task granularity.

## Validate the queue

    node scripts/ralph-tasks.mjs validate .scratch/reusable-label-printing

Validation fails when task order, dependencies, source provenance, acceptance-criterion coverage, or source-issue completion state diverges.

## Synchronize completed issues

After Ralph marks tasks complete:

    node scripts/ralph-tasks.mjs sync .scratch/reusable-label-printing

The command changes a source issue to `resolved` only when every task derived from that issue has `passes: true`. Run validation afterward. A customized Ralph prompt may perform this sequence after marking the current task complete and before committing.

## Blocker policy

Known blockers are handled before execution: blocked work does not enter the runnable queue. If an agent discovers a new runtime blocker, it must emit Ralph's `BLOCKED` or `DECIDE` signal and stop the entire loop. Resolve or replan the condition before restarting.

Do not silently skip blocked work. Stock Ralph has no persistent blocked-task state and would otherwise select the same incomplete task again.

## Repository-specific setup

The first generated work comes from issue 14 and bootstraps the application workspace. Customize Ralph's prompt after installation so it does not assume the development server or package scripts exist before that bootstrap task completes. Once the workspace exists, use only the scripts declared by the repository.

Before every unattended run:

1. Commit or deliberately discard all existing changes.
2. Generate and validate the queue.
3. Review newly generated tasks and blocked work.
4. Run one bounded iteration before increasing the iteration limit.
5. Inspect every resulting commit before pushing.
