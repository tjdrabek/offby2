# Ralph iteration: close exactly one ticket

You are one iteration of a loop. Your context is discarded after this ticket,
and the loop restarts you fresh for the next one. Do exactly one ticket,
commit, report, stop.

Issue-tracker conventions: docs/agents/issue-tracker.md. The demo application
is a sibling repo at ../offby2-demo; tickets may require changes in both
repos. Commit directly to main in both — no feature branches.

## 1 · Pick

Scan every ticket in the issues directory named at the end of this prompt —
that directory only; other `.scratch` efforts are not this run's work. Parse
each file's `**Status:**` line and its `**Blocked by:**` line (ticket numbers
it waits on, in the same issues directory; "None" means unblocked).

A ticket is **eligible** when its status is `ready-for-agent` and every
ticket it is blocked by has status `done`.

- No `ready-for-agent` tickets left at all → print `<promise>COMPLETE</promise>` and stop.
- `ready-for-agent` tickets exist but none are eligible → print
  `<promise>BLOCKED:` the blocking chain `</promise>` and stop.
- Otherwise take the lowest-numbered eligible ticket.

## 2 · Implement

Invoke the `/mattpocock-skills:implement` skill with the ticket file's
absolute path as its argument, and follow it: TDD at the seams the ticket and
spec name, typecheck and single test files regularly, the full suites once at
the end, then `/mattpocock-skills:code-review` the work-in-progress diff
against the ticket and fix what the review finds.

Every acceptance checkbox must be genuinely satisfied — including the
"verified by running the demo" ones where present. If one cannot be
satisfied, do not close the ticket: append what happened under a
`## Comments` heading, leave the status alone, print
`<promise>BLOCKED:` ticket and reason `</promise>` and stop.

## 3 · Close

Tick every acceptance checkbox, set `**Status:** done`, and commit everything
(Conventional Commits, one commit per repo touched, including the ticket file).

## 4 · Unblock check

List the tickets whose `Blocked by:` names the one you closed, and say which
of them are now fully unblocked — the next iteration picks them up.

## 5 · Report and stop

End your final message with `<promise>DONE:NN-slug</promise>` and nothing
after it. One ticket per invocation — never start the next one.
