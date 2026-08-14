# Ralph Loop fit for the reusable-label-printing issues

Research date: 2026-08-14

## Conclusion

Ralph Loop can execute this effort, but it will not directly iterate the existing Markdown issue files without adaptation. Its required queue is `.agent/tasks.json`, with detailed JSON specifications under `.agent/tasks/`. The safest integration is a one-way, reviewable conversion from implementation issues 14–28 into Ralph tasks while retaining the Markdown issues as the planning source of truth.

Start with issue 14 as a pilot. Split it into small Ralph tasks rather than mapping one issue to one task, verify the generated task set manually, run one iteration, and inspect the commit before allowing a longer loop.

## What Ralph actually consumes

- Each iteration finds the highest-priority incomplete entry in `.agent/tasks.json`, reads its `.agent/tasks/TASK-{ID}.json` specification, verifies the work, marks `passes: true`, commits, and starts a fresh invocation for the next task. Source: [README — How It Works](https://github.com/PageAI-Pro/ralph-loop/blob/main/README.md#how-it-works).
- `.agent/tasks.json` and `.agent/PROMPT.md` are mandatory preflight files. Source: [preflight.sh](https://github.com/PageAI-Pro/ralph-loop/blob/main/scripts/lib/preflight.sh).
- The root task entry contains `id`, `title`, `category`, `specFilePath`, and `passes`; detailed task files contain acceptance criteria, steps, and optional dependencies. Source: [task generation format](https://github.com/PageAI-Pro/ralph-loop/blob/main/.agent/skills/prd-creator/JSON.md).
- Ralph is intentionally prompt-controlled and hackable. It supports Claude, Codex, Copilot, Cursor, Gemini, and OpenCode through Docker Sandboxes. Source: [README — supported agentic CLIs](https://github.com/PageAI-Pro/ralph-loop/blob/main/README.md#running-with-a-different-agentic-cli).

## MCP clarification

The repository contains `.mcp.json`, but that configures MCP servers such as Playwright and Context7 for the coding agent to call. The current repository does not expose Ralph itself as an MCP server for queueing external issues. Its public execution interface is the installed shell loop and its `.agent/` files. Sources: [repository `.mcp.json`](https://github.com/PageAI-Pro/ralph-loop/blob/main/.mcp.json), [ralph.sh](https://github.com/PageAI-Pro/ralph-loop/blob/main/ralph.sh), and [README installation](https://github.com/PageAI-Pro/ralph-loop/blob/main/README.md#getting-started).

If a separate/newer MCP wrapper is intended, its URL or package name needs independent evaluation; it is not present in the linked repository's current main branch.

## Fit with this tracker

This repository uses Markdown issues under `.scratch/reusable-label-printing/issues/`, with `Status` and `Blocked by` metadata. The current implementation frontier is issue 14; issues 14–28 are implementation tickets, while issues 01–13 are mostly resolved design work or physical-evidence work. Local source: `docs/agents/issue-tracker.md` and `.scratch/reusable-label-printing/map.md`.

A direct mapping has three problems:

1. **Different state models.** Local tickets use `ready-for-agent`, `open`, and `resolved`; Ralph uses `passes: false/true`.
2. **Ticket size.** Ralph's own task-generation guidance targets tasks small enough to complete in about ten minutes. The local implementation tickets describe larger vertical slices and should generally become multiple Ralph tasks. Source: [prd-creator skill](https://github.com/PageAI-Pro/ralph-loop/blob/main/.agent/skills/prd-creator/SKILL.md).
3. **Dependency selection.** Ralph's default prompt selects the highest-priority `passes: false` task. Although detailed specs support `dependencies`, the default selection instruction does not explicitly require scanning dependency completion before choosing. Queue order should therefore be topological, and physically blocked work should not be added as runnable incomplete tasks. Sources: [default prompt](https://github.com/PageAI-Pro/ralph-loop/blob/main/.agent/PROMPT.md) and [dependency format](https://github.com/PageAI-Pro/ralph-loop/blob/main/.agent/skills/prd-creator/JSON.md#using-dependencies).

## Repository structure adaptations

The repository is currently a planning repository rather than the already-running application assumed by Ralph's defaults. There is no application package or established test command yet; creating that workspace is itself issue 14. The stock prompt assumes an application under `src`, starts `npm run dev` before selecting work, and then runs ESLint, Prettier, TypeScript, unit tests, and Playwright. Those assumptions would fail before issue 14 creates the application.

Do not restructure the product around Ralph. Treat `.agent/` and `ralph.sh` as a control plane around the repository, and customize them as follows:

- Make the first Ralph tasks bootstrap the Vite/React/TypeScript application and its test commands from issue 14.
- Replace the unconditional startup instruction with a conditional instruction: use the bootstrap task's verification commands until the package exists, then use the scripts declared by the created package.
- Point every fresh invocation at `AGENTS.md`, `CONTEXT.md`, the accepted ADRs, the feature spec, and the source issue for its task.
- Generate `.agent/STRUCTURE.md` only after the workspace exists; do not invent the final source tree in advance.
- Require a clean worktree at loop start and path-scoped staging for each task commit.
- Keep product code in the structure chosen by issue 14. Ralph's `.agent/` layout does not require production code to live under `src`; that path is only a default prompt assumption.
- On Windows, run the Bash loop through a supported Bash environment and verify Docker Sandboxes before unattended use.

Sources: [default prompt](https://github.com/PageAI-Pro/ralph-loop/blob/main/.agent/PROMPT.md), [README — adapting the language/framework](https://github.com/PageAI-Pro/ralph-loop/blob/main/README.md#optional-adjusting-to-your-languageframework), and [preflight requirements](https://github.com/PageAI-Pro/ralph-loop/blob/main/scripts/lib/preflight.sh).

## How blockers work

Ralph has run-level signals, not a full issue-level blocker scheduler:

- `<promise>BLOCKED:reason</promise>` stops the entire loop with exit code 2. After the human fixes the environment or prerequisite, rerunning Ralph resumes from the still-incomplete task.
- `<promise>DECIDE:question</promise>` stops the loop with exit code 3 for a human decision.
- A successful task emits `<promise>TASK-{ID}:DONE</promise>` and stops that invocation; the outer loop then starts the next fresh invocation.
- `<promise>COMPLETE</promise>` exits successfully when all tasks pass.

Stock Ralph does not persist a `blocked` task state, automatically skip one blocked task and continue another, or derive the runnable frontier from this repository's `Blocked by` lines. Because the blocked task remains `passes: false`, an unchanged restart is likely to select it again.

Use two blocker policies:

1. **Known planning dependencies:** the converter emits only currently runnable work, or places tasks in strict topological order and validates every dependency before a run. Physically gated work remains outside the active queue.
2. **Discovered runtime blockers:** the agent emits `BLOCKED` or `DECIDE`, the whole loop stops, and a human resolves or explicitly replans the condition before restart. Do not silently skip a task whose incomplete contract may invalidate later work.

If continuing unrelated work after a blocked task is required, that is a deliberate extension: add a persistent `state` such as `ready`, `blocked`, and `passed`, record `blockedReason`, and change task selection to choose only `ready` tasks whose dependencies passed. The stock prompt and shell loop do not provide that behavior.

Sources: [README — promise tags and exit codes](https://github.com/PageAI-Pro/ralph-loop/blob/main/README.md#support), [promise.sh](https://github.com/PageAI-Pro/ralph-loop/blob/main/scripts/lib/promise.sh), and [ralph.sh blocker handling](https://github.com/PageAI-Pro/ralph-loop/blob/main/ralph.sh).

## Recommended integration

1. Keep the Markdown spec, map, and issue files authoritative.
2. Install Ralph only after the current planning changes have been reviewed and committed; the worktree currently contains modified and untracked tracker files, while Ralph commits once per completed task.
3. Generate `.agent/prd/PRD.md` from the existing spec and `.agent/prd/SUMMARY.md` from the map/ADRs without replacing those originals.
4. Convert only the current runnable implementation frontier, beginning with issue 14. Add provenance such as `sourceIssue: ".scratch/reusable-label-printing/issues/14-local-first-application-shell.md"` in technical notes or descriptions.
5. Split each issue into small independently verifiable Ralph tasks. Preserve each issue's acceptance criteria across the resulting task group.
6. Put tasks in dependency-safe order. Do not queue issue 26 as runnable until physical issues 13, 07, and 09 are resolved. Do not feed unresolved research/grilling tickets to an unattended implementation loop.
7. Customize `.agent/PROMPT.md` for this Vite/React PWA's real commands, paths, accessibility requirements, and local issue conventions. Require the agent to update the source issue status only after every Ralph task derived from that issue passes.
8. Add a deterministic validator that checks: every queued task has a source issue, no task is runnable before its prerequisites, every source acceptance criterion is represented, and completion state does not diverge.
9. Pilot with one Ralph invocation, inspect tests and commit scope, then run a small bounded batch before considering unattended execution.

## Risks

- **Dirty-worktree commits:** existing planning edits could be accidentally included in an agent commit. Establish a clean baseline first.
- **State divergence:** independently editing Markdown status and JSON `passes` creates two sources of truth. Prefer generated JSON plus validation, not bidirectional manual synchronization.
- **Oversized work:** one local issue per Ralph task would exceed Ralph's intended granularity and reduce reliable verification.
- **Blocked physical work:** issues requiring printer, stock, measurement, or human observations must stop with a human decision/block signal rather than be "completed" from software evidence.
- **Environment mismatch:** Ralph uses Bash and Docker Sandboxes; on this Windows host the installation path must provide the required Bash/Docker environment and the sandbox must be able to run the project's browser tests.
- **Unattended architecture drift:** the loop uses fresh contexts. The generated summary, prompt, ADR references, domain context, and per-task acceptance criteria must carry the durable constraints into every iteration.

## Practical verdict

Use Ralph as an execution engine, not as the issue tracker. A small converter/validator is sufficient; a custom MCP server is unnecessary unless another system must remotely query and mutate the queue. The best first experiment is issue 14 only, decomposed into several reviewed tasks, followed by a single-iteration run and commit review.
