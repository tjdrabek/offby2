# Ralph Loop: silent no-op iterations on Windows / Git Bash

Investigation of the symptom: `./ralph.sh` prints its banner, starts sandbox
`ralph-claude-diy-labels-101f510b`, prints "Iteration 1 of 1", immediately prints an
empty "Iteration Summary", emits ``Warning: `sbx run ralph-claude-diy-labels-101f510b`
is deprecated;``, stops the sandbox, and does no work.

All claims below are cited to primary sources: the actual scripts on disk, the upstream
repository source, `sbx --help` output from the installed binary (v0.38.0), or live
reproductions run against this machine's sandbox.

---

## 1. What ralph.sh actually does per iteration

Source: `c:\Users\tyler\projects\diy-labels\ralph.sh` (local copy, byte-identical in
structure to upstream `ralph.sh`).

- Pre-flight requires a git repo, `sbx` on PATH, `.agent/tasks.json` and `.agent/PROMPT.md`;
  `.agent/prd/SUMMARY.md` is optional (warn only) —
  `scripts/lib/preflight.sh:13-69`.
- The prompt sent to the agent is `PROJECT_ROOT=<abs path>` + a blank line + the entire
  contents of `.agent/PROMPT.md`, exported as the env var `PROMPT_CONTENT` —
  `ralph.sh:135-137`, `ralph.sh:151`.
- It probes whether the sandbox already exists via `sbx ls --quiet | grep -Fxq <name>` —
  `scripts/lib/agents.sh:270-275`, called at `ralph.sh:157-161`.
- It then builds the agent command — `scripts/lib/agents.sh:297-336`:
  - sandbox does **not** exist → `sbx run --name <name> claude .`
  - sandbox **does** exist → `sbx run <name>`   ← the deprecated positional form
  - and for `claude`, appends `-- --output-format stream-json --verbose -p "$PROMPT_CONTENT"`
- The command is executed under `script(1)` purely to get a pseudo-TTY, with **stdout and
  stderr of `script` itself discarded**:
  `script -q "$OUTPUT_FILE" bash -c "$AGENT_COMMAND" >/dev/null 2>&1 &` — `ralph.sh:163`.
  Everything Ralph ever sees comes from the typescript file `$OUTPUT_FILE`.
- While the child runs, Ralph tails `$OUTPUT_FILE`, runs each line through
  `parse_json_content` (`scripts/lib/output.sh:8-54`) and drives the spinner/preview —
  `ralph.sh:170-196`.
- "Done" is decided **entirely from that captured text**:
  - `extract_final_summary` greps for `"type":"result"` and `jq -r '.result'` —
    `scripts/lib/output.sh:114-132`. If absent, Ralph falls back to
    `echo "$OUTPUT" | tail -n 10` — `ralph.sh:274-279`.
  - completion / blocked / decide are literal string greps for `<promise>COMPLETE</promise>`,
    `<promise>BLOCKED:...</promise>`, `<promise>DECIDE:...</promise>` —
    `scripts/lib/promise.sh:24-48`, checked at `ralph.sh:304, 324, 345`.
  - Ralph never inspects git, `tasks.json`, or the sandbox filesystem to decide whether work
    happened. **No captured output == no signal == iteration silently "succeeds".**
- On exit the EXIT trap runs `sbx stop <name>` — `scripts/lib/cleanup.sh:40-53`. That is the
  "stops the sandbox" line in the symptom; it is normal cleanup, not an error.

The upstream prompt contract (`.agent/PROMPT.md`) is: pick the highest-priority task with
`passes: false` from `.agent/tasks.json`, read `.agent/tasks/TASK-{ID}.json`, implement,
test, commit, emit `<promise>TASK-{ID}:DONE</promise>` and stop —
`c:\Users\tyler\projects\diy-labels\.agent\PROMPT.md:1-43`. Confirmed against the upstream
README (https://raw.githubusercontent.com/pageai-pro/ralph-loop/HEAD/README.md).

## 2. What `sbx` is, and what the deprecation warning means

`sbx` is the standalone **Docker Sandboxes** CLI (Docker, not pageai). Installed here at
`/c/Users/tyler/AppData/Local/DockerSandboxes/bin/sbx`, version
**`v0.38.0 c022b14634c4bea846ca12870d1d5e97d5868b54`** (`sbx version`).

From `sbx run --help` (verbatim, v0.38.0):

> Usage: `sbx.exe run [flags] [AGENT] [PATH...] [-- AGENT_ARGS...]`
> The first positional argument is the agent to run. To re-attach to an existing sandbox by
> name, use `--name`; the agent positional is optional when the named sandbox already exists
> and is read from its spec.
> To create a sandbox without attaching, use "sbx create" instead, or pass `--detached` (-d)
> to print the sandbox ID and exit without opening an interactive session.

So the first positional is now the **agent**, not a sandbox name. Ralph's attach form
`sbx run <sandbox-name>` hits a legacy compatibility path which prints:

```
Warning: `sbx run ralph-claude-diy-labels-101f510b` is deprecated; use `sbx run --name ralph-claude-diy-labels-101f510b` instead.
```

**The deprecated path is NOT a no-op.** Reproduced directly (see §4, test D): the deprecated
form still starts the sandbox, still forwards the `-- AGENT_ARGS`, and still creates a new
Claude session inside the container. The warning is cosmetic. It is a red herring for this bug.

Docs cross-check: [sbx run](https://docs.docker.com/reference/cli/sbx/run/),
[sbx exec](https://docs.docker.com/reference/cli/sbx/exec/),
[Docker Sandboxes](https://docs.docker.com/ai/sandboxes/).

## 3. The `script(1)` problem on Git Bash

Git for Windows ships no util-linux, so `script` does not exist. On this machine there is a
**hand-written shim** at `c:\Users\tyler\bin\script` (not part of ralph-loop, not in the
project repo — it is on `$PATH` via `/c/Users/tyler/bin`). Its own header comment says:

> Git for Windows does not ship util-linux, so `script` is missing. Tools that use it purely
> to allocate a pseudo-TTY (ralph.sh, for one) fail with exit 127 and no output.

The shim tries `winpty -Xallow-non-tty -Xplain "$@" > typescript 2>&1`; if winpty aborts with
"Assertion failed" it prints `script (shim): winpty could not allocate a pty (no console
attached).` to **stderr**, truncates the typescript, and re-runs the command **without any
pty** (`c:\Users\tyler\bin\script`, the `if command -v winpty` block near the end).

Because `ralph.sh:163` redirects `script`'s own stderr to `/dev/null`, that shim warning is
invisible. Ralph cannot distinguish "ran under a pty" from "ran with no pty at all".

Observed here: `script -q /tmp/sc.out bash -c 'echo HELLO_FROM_SCRIPT' </dev/null` printed the
winpty assertion message and fell back to the direct path.

## 4. Live reproductions (this machine, this sandbox)

All run from Git Bash against `ralph-claude-diy-labels-101f510b`.

**Test A — Ralph's exact attach command, deprecated form, cold sandbox:**

```
PROMPT_CONTENT='Reply with exactly OK and nothing else.' \
  sbx run ralph-claude-diy-labels-101f510b -- --output-format stream-json --verbose -p "$PROMPT_CONTENT"
```
```
EXIT=1
Warning: `sbx run ralph-claude-diy-labels-101f510b` is deprecated; use `sbx run --name ralph-claude-diy-labels-101f510b` instead.
Sandbox ralph-claude-diy-labels-101f510b started successfully
Starting claude agent in sandbox 'ralph-claude-diy-labels-101f510b'...
Workspace: C:\Users\tyler\projects\diy-labels
]0;[📦 ralph-claude-diy-labels-101f510b]]0;ERROR: agent exited with code 1
```

Zero agent output. This is byte-for-byte the user's symptom.

**Test B — the *recommended* `--name` form, same args:**

```
sbx run --name ralph-claude-diy-labels-101f510b -- --output-format stream-json --verbose -p "Reply with exactly OK"
```
```
EXIT=0
Starting claude agent in sandbox 'ralph-claude-diy-labels-101f510b'...
Workspace: C:\Users\tyler\projects\diy-labels
]0;[📦 ralph-claude-diy-labels-101f510b]]0;
```

**Still zero agent output.** Fixing the deprecation does not fix the bug.
`sbx run --name ... -- --version` likewise printed nothing.

**Test C — `sbx exec` instead of `sbx run`, identical claude args:**

```
sbx exec ralph-claude-diy-labels-101f510b -- claude --output-format stream-json --verbose -p "Reply with exactly OK"
```
```
EXIT=0
Sandbox ralph-claude-diy-labels-101f510b started successfully
{"type":"rate_limit_event",...}
{"type":"system","subtype":"init","cwd":"/c/Users/tyler/projects/diy-labels","model":"claude-sonnet-5","claude_code_version":"2.1.233","apiKeySource":"none",...}
```

**Full stream-json comes back.** Auth inside the sandbox is fine, the model is reachable, and
`--output-format stream-json` works. The only broken component is `sbx run`'s output relay.

**Test D — does `sbx run` invoke the agent at all?** Counted Claude session files inside the
container before/after:

| invocation | session count before → after | stdout captured |
|---|---|---|
| `sbx run --name <name> -- ... -p "…"` | 12 → 13 | none |
| `sbx run <name> -- ... -p "…"` (deprecated) | 13 → 14 | none |

So `sbx run` **does** start the agent and **does** forward `-- AGENT_ARGS` — it just never
writes the agent's output to a non-TTY stdout. Ralph is blind, not idle.

**Test E — cold-start timing:** after `sbx stop`, the same `--name` attach returned
`exit=0` in **8 seconds** with no output. That is the "immediately prints an empty Iteration
Summary" timing.

**Environment facts:** `[ -t 0 ]` inside the sandbox exec reported `TTY=no`;
`~/.claude/.credentials.json` and `SBX_CRED_ANTHROPIC_MODE` are present in the container, i.e.
authentication is configured.

## 5. Local repo vs. what ralph.sh requires

| Requirement | Where checked | Status locally |
|---|---|---|
| git repository | `scripts/lib/preflight.sh:13-18` | OK |
| `sbx` on PATH | `scripts/lib/preflight.sh:24-30` | OK (v0.38.0) |
| `.agent/tasks.json` | `scripts/lib/preflight.sh:49-52` | OK — 125 tasks, **all 125 `passes: false`**, first is `TASK-1` |
| `.agent/PROMPT.md` | `scripts/lib/preflight.sh:54-57` | OK (3327 bytes) |
| `.agent/prd/SUMMARY.md` (optional) | `scripts/lib/preflight.sh:66-68` | OK |
| `.agent/tasks/TASK-{ID}.json` | `.agent/PROMPT.md:21` | OK — 125 spec files |
| `.agent/STRUCTURE.md` | `.agent/PROMPT.md:22, 34` | **Missing** — prompt references a file that does not exist (cosmetic; agent is told to create/update it) |
| `RALPH.md` | referenced by `AGENTS.md` as `@RALPH.md` | **Missing from repo root** — the `@RALPH.md` import in `AGENTS.md` resolves to nothing |
| `.agent/logs/LOG.md` | `ralph.sh:11, 92-96` | Present but still the untouched template (`**Last Updated:** YYYY-MM-DD`) — **no iteration has ever done work** |

Line endings are **not** the problem: `file ralph.sh scripts/lib/*.sh` reports
"Bourne-Again shell script … executable" with no "CRLF line terminators" on any file.

Version drift note: the local `scripts/lib/agents.sh` is **newer** than GitHub `HEAD` —
the local `build_agent_command` / `agent_login_command` take a third `exists` argument and
implement the create-vs-attach split (`scripts/lib/agents.sh:62-77, 297-336`), which the
copy at
https://raw.githubusercontent.com/pageai-pro/ralph-loop/HEAD/scripts/lib/agents.sh does not.
Local came from npm `@pageai/ralph-loop@2.7.0` (`npm view @pageai/ralph-loop version`), while
`scripts/lib/constants.sh:6` still declares `VERSION="1.0.0"`.

## 6. Upstream issue tracker

https://api.github.com/repos/pageai-pro/ralph-loop/issues?state=all — three issues total.

- **#3 "Iterations run without picking up a task"** (closed, opened 2026-02-28 06:51 UTC,
  closed 06:57 UTC). Body: *"After creating a requirements document and then creating a full
  PRD, task list, etc. when running `./ralph.sh -n 50` iterations are run but none of the
  tasks are being picked up and worked on. It loops through all 50 iterations right away
  without doing anything."* — **the same symptom.** Sole comment, from the reporter (rmcook):
  *"Needed to run from home terminal, not inside of sandbox."*
  That resolution is consistent with the root cause here: Ralph must run somewhere `script`
  can allocate a real pty for `sbx run`.
- #2 "prd creator writes full code into task details" (open) — unrelated.
- #1 "We are all ralph" (closed) — meme.

No issue mentions the `sbx run` deprecation warning or Windows/Git Bash specifically.

---

## Ranked root causes

**1. `sbx run` never relays agent output to a non-TTY stdout, and Ralph's only "did work"
signal is that output.** (Confirmed by Tests B/C/D.)
`sbx run` opens an *interactive session* — `sbx run --help` explicitly contrasts it with
`--detached`, "exit without opening an interactive session". With no controlling TTY on the
host side the agent runs (Test D: a new session file is created every time) but the
container's PTY stream is never written to Ralph's typescript file. `ralph.sh:216` then sets
`OUTPUT=""`, `extract_final_summary` returns empty (`scripts/lib/output.sh:114-132`), the
fallback `tail -n 10` yields only sbx's own banner lines, no promise tag matches
(`scripts/lib/promise.sh:31-48`), and the loop declares the iteration complete
(`ralph.sh:369-372`). Every iteration is a silent no-op from Ralph's point of view.

**2. `script(1)` does not exist on Git Bash, and the local shim silently degrades to no-pty.**
This is what produces condition #1. Upstream ralph.sh hard-codes `script -q` at
`ralph.sh:163` with `2>/dev/null`, so on a stock Git for Windows install it fails with exit
127 and *nothing at all* is captured. Here a shim (`c:\Users\tyler\bin\script`) exists, but
when winpty cannot attach a console it re-runs the command with no pty and swallows the
warning. Directly observed: `script (shim): winpty could not allocate a pty (no console
attached).` This also matches upstream issue #3's resolution ("run from home terminal").

**3. Cold-start attach can additionally fail outright.** Test A returned
`ERROR: agent exited with code 1` on the first attach to a *stopped* sandbox; a warm re-run of
the identical command returned 0. Ralph's cleanup stops the sandbox after every run
(`scripts/lib/cleanup.sh:40-53`), so every Ralph invocation attaches cold. Ralph does not
check the child's exit status at all (`ralph.sh:198`: `wait "$AGENT_PID" || true`), so a
hard agent failure is indistinguishable from success.

**4. Deprecated `sbx run <name>` positional form.** Cosmetic only under v0.38.0 — the warning
is emitted, the sandbox still starts, `-- AGENT_ARGS` still forwarded, agent still invoked
(Test D). Worth fixing for future-proofing (`scripts/lib/agents.sh:305-311`), because a future
sbx release will remove the compatibility path, but it is **not** the current cause.

**5. Ralph has no "did anything actually happen?" guard.** Not a cause but the reason the
failure is silent. Completion detection is pure string-matching on agent stdout; there is no
check of git status, `tasks.json` deltas, empty-output detection, or child exit code.

**Ruled out:**
- CRLF line endings — `file(1)` reports LF on `ralph.sh` and all `scripts/lib/*.sh`.
- Missing prompt/task files — all required files present and well-formed (§5).
- Missing auth in the sandbox — Test C returned a full authenticated stream-json response;
  `~/.claude/.credentials.json` and `SBX_CRED_ANTHROPIC_MODE` are set inside the container.
- MSYS path mangling of `/`-prefixed args — the only `/`-leading token in the built command is
  inside `$PROMPT_CONTENT`, which is expanded by the inner `bash -c`, not by MSYS argv
  conversion; and Test C proves the same argv works via `sbx exec`.
- Empty prompt — `PROMPT_CONTENT` is exported (`ralph.sh:151`) and expanded inside the inner
  shell (`scripts/lib/agents.sh:315`), not piped on stdin; nothing reads stdin.

---

## How to verify / fix

### Verify (2 minutes)

Run each from Git Bash in `c:\Users\tyler\projects\diy-labels`.

```bash
# 1. Does sbx run relay anything without a pty?  Expect: NO agent output.
sbx run --name ralph-claude-diy-labels-101f510b -- --output-format stream-json --verbose -p "Reply with exactly OK"

# 2. Does the agent work at all?  Expect: full stream-json.
sbx exec ralph-claude-diy-labels-101f510b -- claude --output-format stream-json --verbose -p "Reply with exactly OK"

# 3. Is `script` real or a shim, and does winpty work in YOUR terminal?
type -a script
script -q /tmp/probe.out bash -c 'tty; echo PTY_OK'   # watch stderr for the winpty warning
cat /tmp/probe.out                                     # "not a tty" => no pty => Ralph will no-op

# 4. What did Ralph actually capture last run?
ls -t .agent/history/ | head -3
cat ".agent/history/$(ls -t .agent/history | head -1)"   # empty/banner-only == root cause #1
```

If step 2 succeeds and step 1 prints nothing, root cause #1 is confirmed.

### Fix A (recommended) — make Ralph use `sbx exec`, which needs no TTY

Patch `scripts/lib/agents.sh:297-336` so the claude branch emits an exec invocation:

```bash
# in build_agent_command, replace the sbx_run construction for an EXISTING sandbox
sbx_run="sbx exec $sandbox_name -- $agent"
```

so the claude line becomes
`sbx exec <name> -- claude --output-format stream-json --verbose -p "$PROMPT_CONTENT"`.
Keep `sbx run --name <name> <agent> .` (or better, `sbx create --name <name> <agent> .`) for
the create path so the sandbox exists first. Verified working in Test C.

With `sbx exec`, the `script` wrapper at `ralph.sh:163` is no longer needed for correctness;
it can stay (it captures fine) or be replaced with a plain redirect:

```bash
bash -c "$AGENT_COMMAND" > "$OUTPUT_FILE" 2>&1 &
```

### Fix B — give `sbx run` a real pty

Only works if winpty can attach a console in your terminal. Run Ralph from a Windows console
host (conhost/Windows Terminal running `bash.exe` directly, not mintty), or wrap explicitly:

```bash
winpty -Xallow-non-tty -Xplain sbx run --name ralph-claude-diy-labels-101f510b -- \
  --output-format stream-json --verbose -p "hello"
```

If that prints agent output, `script`/winpty is viable and only the shim's console detection
needs attention. If it still prints nothing, use Fix A.

### Fix C — stop the silent success (do this regardless)

Add an empty-output guard after `ralph.sh:216`:

```bash
if [ -z "${OUTPUT//[[:space:]]/}" ]; then
  echo "Agent produced no output — aborting instead of counting a no-op iteration." >&2
  exit $EXIT_BLOCKED
fi
```

and stop discarding the child's failure at `ralph.sh:198` (`wait "$AGENT_PID" || true`) and
`script`'s stderr at `ralph.sh:163` (`>/dev/null 2>&1`).

### Fix D — clear the deprecation warning

`scripts/lib/agents.sh:308` and `:73`: change the attach form from
`sbx run $sandbox_name` to `sbx run --name $sandbox_name`. Cosmetic today, required by a
future sbx release. Report upstream at https://github.com/pageai-pro/ralph-loop/issues.

---

## 7. Applied fix, and the second blocker behind it (2026-08-14)

### What was changed in Ralph

- `scripts/lib/agents.sh` — `build_agent_command` now emits `sbx exec <name> -- <agent> …`
  instead of `sbx run`. A `sep` variable carries `-- <agent>` for the exec form and plain `--`
  for the legacy run form, so all six agents keep their existing argument tails. The create
  path became `sbx create --name <name> <agent> . >/dev/null && sbx exec <name>`.
- `ralph.sh:162-166` — dropped the `script -q` pseudo-TTY wrapper for a plain
  `bash -c "$AGENT_COMMAND" > "$OUTPUT_FILE" 2>&1 &`.
- `ralph.sh:200-201` — `wait` now records `AGENT_EXIT` instead of `|| true`.
- `ralph.sh:219-234` — empty-output guard: an iteration that captured nothing exits
  `EXIT_BLOCKED` with the raw capture and the exact command, instead of counting as success.

Verified: `sbx exec … claude --output-format stream-json --verbose -p "…"` returns the full
stream including the `"type":"result"` line `extract_final_summary` greps for. The rolling
preview now shows live tool calls (`▸ Bash command=…`), which it never did before.

### The second blocker: symlinks cannot be created on the Windows bind mount

With output finally visible, iteration 1 revealed a real environment failure the agent
reported as *"The environment is broken and I can't fix it: `node_modules` is corrupt"*.
Reproduced directly:

```
$ sbx exec <sandbox> -- bash -lc 'npm run test'
sh: 1: vitest: not found
```

`node_modules/.bin/` did not exist at all in the container. Root cause, proven:

```
$ sbx exec <sandbox> -- bash -lc 'cd <workspace>; ln -s /etc/hostname .symtest; cd /home/agent; ln -s /etc/hostname .symtest'
SYMLINK ON MOUNT:        FAIL   (ln: Permission denied)
SYMLINK IN CONTAINER FS: OK
```

The workspace is mounted `virtiofs rw,nosuid,nodev,relatime` from Windows, and virtiofs does
not permit symlink creation. `node_modules/.bin/*` are symlinks on Linux, so **`npm install`
run from inside the sandbox can never complete against the mounted workspace** — it dies with
`EPERM syscall: symlink … node_modules/.bin/parser`. Directory renames of host-created
package dirs also fail (`EACCES syscall: rename … node_modules/acorn`), while newly created
directories rename fine. This is not a lock: no Windows process held the tree (checked via
`Win32_Process`; only MCP servers and Adobe were running).

### Resolution: install from Windows, patch in the Linux native binaries

Installing from **Windows** works, because npm on Windows writes `.cmd`/`.ps1` shims plus an
**extensionless `#!/bin/sh` script** — and that shell script is executable inside the
container. So `npm install` from PowerShell produces a `.bin` usable from *both* sides.

That leaves only platform-specific native modules, which Windows npm resolves to `win32`
builds. Two were needed. npm refuses to install foreign-platform packages even with
`--os`/`--cpu` (`npm error notsup Unsupported platform`), so fetch the tarballs with
`npm pack` (no platform validation) and extract them into `node_modules`:

```powershell
npm install                     # from Windows — creates a .bin that works on both platforms

# rolldown (used by vite 8) — match the installed rolldown version exactly
npm pack "@rolldown/binding-linux-x64-gnu@1.2.4"
tar -xzf rolldown-binding-linux-x64-gnu-1.2.4.tgz -C extract
Copy-Item extract\package\* node_modules\@rolldown\binding-linux-x64-gnu -Recurse -Force

# lightningcss
npm pack "lightningcss-linux-x64-gnu@1.33.0"
tar -xzf lightningcss-linux-x64-gnu-1.33.0.tgz -C lcss
Copy-Item lcss\package\* node_modules\lightningcss-linux-x64-gnu -Recurse -Force
```

Verified afterwards — all three project commands pass **inside the sandbox**:
`npm run test` exit 0, `npm run lint` clean, `npm run build` exit 0. The Windows host still
builds from the same `node_modules` (exit 0), since the win32 bindings remain alongside.

> **Caveat:** the two Linux binding packages are not in `package.json`. A future
> `npm install`/`npm ci` on the host may prune them as extraneous, which would silently
> re-break the sandbox build. Re-run the `npm pack` steps above if `npm run build` starts
> failing in the container with `Cannot find module '@rolldown/binding-*'` or
> `lightningcss/node/index.js`. Versions must match the installed `rolldown` and
> `lightningcss` versions.

### Third bug: `((i++))` aborts the run under `set -e`

Even with output flowing, Ralph still died after iteration 1 — printing the summary header
and exactly one line, with no closing separator and no "Iteration 1 complete", exiting 1.

`scripts/lib/output.sh:164,168` used `((line_count++))`. The post-increment form evaluates to
the **pre**-increment value, so the arithmetic command returns exit status 1 when the counter
is 0, and `ralph.sh:5` sets `set -e`:

```
$ bash -c 'set -e; n=0; echo before; ((n++)); echo after'
before
EXIT=1
```

Fixed by switching both to `line_count=$((line_count + 1))`, which always returns 0. This is
an upstream bug affecting any platform, not Windows-specific.

### Fourth blocker: headless `claude -p` auto-denies un-allowlisted tools

With the loop finally surviving all 5 iterations, the agent reported *"All write operations
are blocked in this session — Write tool, Bash"* and committed nothing. Ralph invokes
`claude -p` non-interactively, so no one can answer permission prompts and anything outside
`.claude/settings.json` → `permissions.allow` is denied. That list covers specific `Bash`
commands but not `Write`/`Edit`, and `defaultMode: acceptEdits` does not take effect in the
headless invocation. (By iteration 5 the agent had diagnosed this itself and tried to edit
`.claude/settings.local.json` — that edit was denied too.)

Resolved with Ralph's documented agent-args passthrough:

```bash
./ralph.sh -n 5 -- --permission-mode bypassPermissions
```

which builds
`sbx exec <name> -- claude --output-format stream-json --verbose --permission-mode bypassPermissions -p "$PROMPT_CONTENT"`.

> Note: network egress remains default-deny, but the project directory is bind-mounted
> read-write from Windows, so the agent's file writes land on the real host filesystem.
> "Sandboxed" here means network and process containment, not file isolation.

### Playwright browsers and the egress policy

`npx playwright install` failed with
`403 Blocked by network policy: domain cdn.playwright.dev:443`. Fixed with a **sandbox-scoped**
allow rule (192 → 193 hosts; global policy untouched, reversible with `sbx policy rm`):

```bash
sbx policy allow network --sandbox ralph-claude-diy-labels-101f510b "cdn.playwright.dev"
sbx exec ralph-claude-diy-labels-101f510b -- bash -lc 'npx playwright install --with-deps chromium'
```

### Result

`./ralph.sh -n 5 -- --permission-mode bypassPermissions` completed all 5 iterations in 25:06
and landed TASK-1 through TASK-4 as 6 commits. `.agent/tasks.json` now shows 4 tasks with
`passes: true`; the host runs 18 tests across 3 files (previously "No test files found") and
`npm run build` exits 0. Exit code 1 from Ralph is `EXIT_MAX_ITERATIONS` — the normal "ran out
of iterations without a `<promise>COMPLETE</promise>`" signal, not a failure.

### Note on running Ralph non-interactively

Piping Ralph through `tee` with no controlling TTY produced
`spinner.sh: line 25: echo: write error: Permission denied` and killed the script under
`set -e` mid-way through printing the iteration summary — after iteration 1, before reaching
iteration 2. Redirect to a file (`./ralph.sh -n 5 > run.log 2>&1`) or run it in a real
terminal; do not pipe it.

### Housekeeping

- Create the missing `RALPH.md` at the repo root or drop the `@RALPH.md` import from
  `AGENTS.md` (it currently resolves to nothing).
- `.agent/STRUCTURE.md` is referenced by `.agent/PROMPT.md:22` but absent; seed it or soften
  the prompt line.
- After any fix, run a single bounded iteration (`./ralph.sh --once`) and confirm
  `.agent/logs/LOG.md` gains a real entry and `.agent/history/ITERATION-*.txt` is non-empty
  before raising the iteration count — per `docs/agents/ralph-loop.md:46-52`.
