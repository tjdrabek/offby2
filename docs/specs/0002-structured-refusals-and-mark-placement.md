---
title: Structured refusals and calibration-mark placement
status: ready-for-agent
date: 2026-08-19
relates-to: ADR-0007
---

# Structured refusals and calibration-mark placement

## Problem Statement

The demo application — the package's first real host — works around the package's interface at two points, and both workarounds are documented in the demo's own code as findings about the package.

First, the package writes its refusal prose for a consumer where every dimension is enterable, so messages end by offering entry as the way out: "…or enter this one", "Enter a value." In the demo, label width and height have no input at all, so that half of the message is an instruction nobody can follow. The demo copes by regex-stripping the entry remedy off the end of the package's sentences — string surgery on another module's prose, which its own docstring calls "a poor way to build on an API". Any future host whose form differs from the one the package imagined will need the same scraping, and a wording change in the package silently breaks every one of them.

Second, the package's `calibrationSheet()` decides for every host where calibration marks go: at the centres of the grid's corner labels. The demo wants marks at one shared, round distance from the sheet's corners — so an operator reads one figure four times instead of transcribing per-mark coordinates, and so a dense layout cannot push marks into the band a consumer printer refuses to print on. To get that, the demo replaces `calibrationSheet()` wholesale and hand-constructs the package's plan type, filling the required grid `row`/`column` fields with admittedly meaningless values. The placement judgement — a domain judgement about what an operator can measure reliably — lives in a host, and the package's target type forces grid coordinates onto marks that belong to the sheet rather than to any label.

## Solution

Both seams close by deepening the package's existing interfaces rather than adding new ones.

Refusals become data before they are prose. A refusal (and each validation issue) carries its explanation and its suggested remedies as separate values, each remedy naming the action it asks for. The package still composes the full sentence — hosts that want one line get exactly what they get today — but a host can now keep the explanation and drop or replace any remedy its interface cannot honour, without touching the package's words. The demo deletes its string surgery and instead omits entry remedies for the fields it does not offer.

Mark placement becomes an input to `calibrationSheet()`. The package ships the placements it knows to be sound — the current corner-label-centre placement stays the default, and the demo's sheet-corner placement (four marks at one shared, round inset from the sheet's edges) moves into the package with its documented trade-offs. The plan says which placement produced it, targets stop being forced to carry grid coordinates, and profile derivation remains indifferent to placement, as it already is. The demo deletes its replacement module and asks the package for the placement it wants.

## User Stories

1. As a host application developer, I want a refusal's explanation and its suggested remedies as separate values, so that I can keep the reason and replace the advice without scraping prose.
2. As a host application developer, I want each remedy to name the action it asks the user to take, so that I can drop remedies my interface cannot honour by what they ask, not by matching their wording.
3. As a host application developer, I want the package to still compose the full message from those parts, so that showing the package's own wording remains a one-liner.
4. As a host application developer whose form has no input for a field, I want to show a derivation refusal without its "enter this one" ending, so that my interface never instructs users to do something it does not allow.
5. As a host application developer, I want the composed message to be exactly what the parts produce, so that the sentence I show and the parts I filter can never tell different stories.
6. As a host application developer, I want validation issues and derivation refusals to share the same explanation-plus-remedies shape, so that one rendering path handles every way the package says no.
7. As a label sheet user reading a refusal, I want the explanation to state what happened and the remedy to state what I can do, so that I am never told to check values on an axis without knowing why.
8. As a package maintainer, I want to reword a remedy without breaking hosts, so that message prose stays mine to improve.
9. As a host application developer, I want to choose where a calibration sheet's marks are placed, so that the placement judgement fits my users' measuring workflow instead of being overridden downstream.
10. As a host application developer, I want the corner-label-centre placement to remain the default, so that existing callers get today's sheets unchanged without naming anything.
11. As a host application developer, I want a sheet-corner placement offered by the package, so that I get marks at one shared, round distance from the sheet's edges without reimplementing the inset search.
12. As a calibration operator using the sheet-corner placement, I want every mark the same round distance from each of the two edges it is measured from, so that I read one figure four times and any mark that is not that figure is the amount it moved.
13. As a calibration operator, I want marks kept well apart on each axis, so that a stretched or rotated print shows up as marks that disagree instead of averaging away.
14. As a calibration operator on a dense sheet layout, I want marks that stay clear of the sheet's edges, so that my printing setup actually prints them — a mark that did not print measures nothing.
15. As a calibration operator, I want the sheet's printed directions to state the one shared distance, so that there is nothing to look up and no chance of reading one mark's target against another mark.
16. As a host application developer, I want the plan to say which placement produced it, so that my scene, preview, and directions can render placement-specific guidance from the plan alone.
17. As a host application developer, I want calibration targets to stop requiring grid coordinates, so that I never fabricate meaningless rows and columns for marks that belong to the sheet rather than to a label.
18. As a package maintainer, I want profile derivation to keep reading only target identities and intended positions, so that every placement — present and future — calibrates through the same arithmetic.
19. As a demo application maintainer, I want to delete the message-scraping module and the wholesale `calibrationSheet` replacement, so that the demo consumes the package the way any host would and carries less code that can drift.
20. As a future contributor, I want the trade-offs between placements documented where the placements live, so that the choice each host makes is informed rather than folkloric.
21. As a small-business user printing labels, I want any app built on this package to show me refusals whose advice I can actually follow, so that a dead-end message never masquerades as help.

## Implementation Decisions

- **Refusal shape.** A refusal or validation issue carries an `explanation` (what happened and why) and a list of remedies, each with a code naming the action it asks for — entering the field's value and checking the other values on the axis are the two actions today's prose contains — plus that remedy's prose fragment. The composed `message` remains on the value, produced by a package composer from the parts, so existing consumers keep working while structured consumers filter remedies by code before composing.
- **Where the shape applies.** Everywhere the sheet-layout entry says no with prose: the required-value issue, count and measurement validation issues, and every derivation refusal. Issues that state a fact with nothing to suggest (for example, a count out of range) simply have no remedies; explanation-only is a valid shape, not a special case.
- **One composer.** Message composition (explanation plus surviving remedies, joined and punctuated) lives in the package once. Hosts never concatenate refusal prose themselves; they choose which remedies survive and let the composer speak.
- **Placement as input.** `calibrationSheet()` accepts a mark placement alongside the geometry. Omitting it means the corner-label-centre placement — current behaviour, byte for byte. The placement input names one of the package's placements; a host does not supply arbitrary coordinates, because the package's warrant is that every placement it offers yields marks an operator can measure and derivation can use.
- **The sheet-corner placement.** The demo's placement moves into the package: four marks at the largest round inset from a preferred list that keeps the marks a minimum distance apart on the sheet's shorter axis, with a floor fallback for tiny sheets, and the mark arm length bounded by the inset. Its trade-off against the default — ink on backing paper versus one round figure, layout-independent targets, and marks that survive dense layouts — is documented on the placements themselves.
- **The plan states its placement.** `CalibrationSheetPlan` records which placement produced it, so scenes and directions can branch on the plan rather than on out-of-band knowledge.
- **Targets shed grid coordinates.** `CalibrationTarget` keeps identity, operator-facing label, and intended position. Grid row and column stop being required; the corner-label placement may still state them where they mean something, but no consumer is forced to invent them. Consumers that asked "does the grid distinguish rows?" can ask the intended positions the same question.
- **Derivation untouched.** `derivePrinterProfile` already reads only target ids and intended positions from the plan; it gains no placement awareness and needs none.
- **Demo consequences.** The demo deletes its message-surgery module and its `calibrationSheet` replacement; the resolution status and field messages compose from refusal parts, omitting the enter-value remedy for the dimensions the demo derives instead of asking for; the calibration tab requests the sheet-corner placement from the package. The demo's measured-from-nearest-edge presentation stays in the demo — how to *ask* an operator for a measurement is host presentation, and the package continues to *store* positions from the sheet's left and top edges.
- **No new ADR.** Both changes grow the engine interface ADR-0007 opened; hosts still own presentation policy under ADR-0001 — choosing which remedies to show and which placement to print is exactly that policy, now expressible without workarounds.

## Testing Decisions

- Tests exercise external behaviour only, through the package's public entry points; no test reaches past an entry point into composition or placement internals.
- **First seam (existing): the sheet-layout entry's resolution results.** The existing resolution and derivation suites extend to assert the parts: each refusal's explanation, its remedies' action codes, and that the composed message equals the composer applied to the parts. The historical prose is pinned through the composed message, so wording survives the restructuring.
- **Second seam (existing): the calibration entry's `calibrationSheet`.** The existing suite gains the placement dimension: the omitted-placement call reproduces today's plans (the regression pin for every current caller), and the sheet-corner placement's cases move in from the demo — the round-inset choice across sheet sizes, the minimum-separation rule, the tiny-sheet fallback, and the arm length bounded by the inset.
- **No new seams.** Both changes deepen functions the package already tests at entry-point level; the demo is verified by its existing scene and focus suites adapting to consume the package's placement, and ends the work with two fewer modules than it started with.
- Prior art: the package's vitest suites for `resolveSheetLayout`, `deriveDimension`, and `calibrationSheet` — pure-data example tests at entry-point level — are the model.

## Out of Scope

- The identity seam (`identity.ts`): the demo's fabricated revision and setup identities and its JSON-string geometry equality are a finding about profile binding for hosts that persist nothing — a separate deepening candidate touching `SheetLayoutRevisionRef` and geometry identity, not these two interfaces.
- Measured-from-nearest-edge measuring instructions moving into the package; the demo's conversion stays host-side presentation for now.
- Arbitrary caller-supplied mark coordinates; placements are package-vetted, not open data.
- Any change to profile derivation, its thresholds, or the observation model.
- Localisation or message catalogues; refusal prose remains English, merely structured.
- The calibration scene, edge labels, ladder lines, or any printable-output rendering.

## Further Notes

- Both workarounds carry their own indictments: `messages.ts` calls itself "a poor way to build on an API", and `cornerMarks.ts` documents its fabricated grid coordinates as values "nothing in derivation reads". The spec's job is to make those docstrings deletable.
- The backlog's framing stands: these are the next evidence for growing the engine interface that ADR-0007 opened after ADR-0002 had deferred it.
- When the sheet-corner placement moves, carry the demo's operator-facing rationale ("one number is the whole instruction"; "a mark that did not print measures nothing") into the package's documentation — it is the trade-off record future hosts will choose by.
