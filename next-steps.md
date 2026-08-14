## Right now, in this prototype session

Type:

> `/handoff Capture what the browser PDF calibration prototype proved, the decisions it supports, remaining uncertainties, how to inspect it, and what production work should preserve. This is a handoff back to the reusable-label-printing idea thread. Reference the prototype at prototype.html.`

Review the generated handoff and ensure it records the actual conclusions—not merely a description of the prototype.

Then:

1. Note the generated handoff file’s path.
2. Return to the **original idea/grilling conversation**.
3. This prototype conversation is now disposable. **Do not clear the original conversation.**

## Back in the original idea conversation

Type:

> `Read the prototype handoff at <handoff-file-path>. Incorporate its conclusions into our working decisions and continue /grill-with-docs from the remaining frontier.`

Replace `<handoff-file-path>` with the generated Markdown file.

Continue answering the grilling questions until the agent says the idea is sufficiently settled.

## Once grilling is finished

For reusable label printing, assume this is a multi-session build. In that **same original conversation**, type:

> `/to-spec Turn our completed reusable-label-printing discussion, documented decisions, and prototype findings into an implementation-ready specification.`

Review and correct the specification. Then, **without clearing**, type:

> `/to-tickets Split this specification into self-contained tracer-bullet implementation tickets. Record explicit blocking edges and reference the browser PDF calibration prototype from every ticket that relies on its findings.`

Review the ticket set and dependency order.

## First clear point

Only after `/to-tickets` has finished and the tickets are self-contained:

1. Run `/clear`.
2. Open the first ticket whose blockers list is empty.
3. Type:

> `/implement Implement this ticket.`

`/implement` should drive the work through TDD and code review, then commit it.

## Between tickets

After a ticket is implemented, reviewed, and committed:

1. Run `/clear`.
2. Open the next ticket whose declared blockers are all complete.
3. Type:

> `/implement Implement this ticket.`

Repeat until all tickets are complete.

## Clear/continue rule

- **After prototype handoff:** leave the prototype session; clearing it is safe.
- **From resumed grilling through `/to-spec` and `/to-tickets`:** **do not clear or compact**.
- **After `/to-tickets`:** clear.
- **After every completed `/implement`:** clear before starting another ticket.
- Compact before `/to-tickets` only if the conversation approaches the smart-zone limit; otherwise preserve the full thread.
