---
title: Content boundary engine extraction
status: ready-for-agent
date: 2026-08-18
relates-to: ADR-0007
---

# Content boundary engine extraction

## Problem Statement

Anyone building a label-printing interface today has to work out for themselves where content stops on a label — how a design's content inset, a printing setup's edge cut-off allowance, and an alignment tolerance combine, and how distances declared on the sheet's axes land on a turned design frame. In the demo application this knowledge is spread across eight modules in three representations (millimetres, CSS percentages, pixels), each with its own hand-written axis remap. The remaps can silently disagree — one direction of padding refusing changes the label has room for, or the preview and the printable output holding content at different lines — and no test would notice, because tests only cover the leaves, not the wiring. Every future host application would have to reinvent this arithmetic and would inherit the same bug surface.

## Solution

The offby2 package becomes the engine for this knowledge. It tells one story: content stops at the most obtrusive **hold-in line** per design-frame axis. A caller hands the engine a set of named hold-in lines — each declaring which axes it lives on — and the design frame, and gets back the **content boundary** and each line's own held distance. The axis remap and the half-extent clamp happen exactly once, inside the engine. Browser conveniences (a CSS custom-property map, an element-readback agreement check) ship as an optional web entry point containing no arithmetic, so a host can attach any UI — React, Svelte, canvas, a CLI printing PDFs — without reimplementing placement math. The demo application deletes its own boundary code and consumes the engine like any other host would.

## User Stories

1. As a host application developer, I want to ask the engine where content stops on a label, so that I never write axis-remap arithmetic myself.
2. As a host application developer, I want to pass any set of named hold-in lines (content inset, edge cut-off allowance, alignment tolerance, or one my app invents), so that one concept covers every way content gets held in.
3. As a host application developer, I want each hold-in line to declare which axes it lives on (sheet or design frame), so that the engine — not my code — decides how a turned design frame receives sheet-axis distances.
4. As a host application developer, I want the engine's answer clamped to less than half the frame's extent per axis, so that a narrow label never yields negative content room in my UI while the printable output disagrees.
5. As a host application developer, I want each line's own held distance back alongside the boundary, so that I can draw guide lines at their true positions — including when they cross — without recomputing anything.
6. As a host application developer, I want the engine to answer in plain data (numbers in, numbers out), so that I can call it from any runtime — browser, Node, a worker — without DOM or framework dependencies.
7. As a web developer, I want an off-the-shelf adapter that turns the boundary into a CSS custom-property map, so that I can style a preview without writing conversion code.
8. As a web developer, I want an off-the-shelf agreement check between the engine's boundary and a rendered element's box, so that I can verify my preview honours the boundary without re-deriving it from computed styles.
9. As a developer rendering to canvas or native UI, I want the web conveniences kept out of the core, so that I take on no browser baggage I don't use.
10. As a calibration user, I want my counted edge cut-off ladder lines and sheet margins turned into a hold-in line by the engine, so that dead-band handling comes off the shelf instead of being each app's problem.
11. As a calibration user, I want the edge cut-off allowance applied per sheet axis (sides separately from tops), so that a column-side dead band never spends room the rows don't need.
12. As a label designer, I want my content inset and the edge cut-off allowance to hold content independently rather than adding, so that I never lose usable label room to double-counting.
13. As a label designer, I want the preview, the fit checks, and the printable output to consult the same boundary, so that what I see is what prints.
14. As a label designer with a sideways design, I want unequal paddings held against the correct screen edges, so that a padding change is never refused when the label has room for it.
15. As an operator using classic alignment-tolerance calibration, I want to pass tolerance as just another hold-in line, so that the older model remains available without a second concept to learn.
16. As an engine maintainer, I want the boundary reachable and fully exercisable through the package's public entry points, so that the interface is the test surface and internals stay free to change.
17. As an engine maintainer, I want a property test asserting the boundary always equals the most obtrusive held line and is invariant under frame rotation with swapped sheet-axis coordinates, so that the historical bug class (disagreeing remaps) is structurally impossible to reintroduce unnoticed.
18. As a demo application maintainer, I want to delete the demo's boundary modules and local remaps, so that the demo carries less test surface and demonstrates how a host consumes the engine.
19. As a future contributor, I want CONTEXT.md and ADR-0007 to define hold-in line, content boundary, and edge cut-off allowance, so that reviews and new code use one vocabulary.
20. As a small-business user printing labels, I want any app built on this engine to place content correctly on any label sheet, so that I am not locked into vendor software like Avery's.

## Implementation Decisions

- The engine's model is **most-obtrusive-line** (ADR-0007): hold-in lines do not add; content stops at whichever held line sits furthest in, per design-frame axis. This replaces the additive tolerance model; the existing symmetric safe-area function is reimplemented as a special case of the boundary or deprecated.
- The core interface lives in the package's main entry, beside the other sheet-layout math. Shape (from the design session):
  `contentBoundary(lines, frame) → { xMm, yMm, lines: { [name]: { xMm, yMm } } }`
  where each input line declares its axes (`"sheet"` or `"frame"`) and its distances, and the frame carries orientation and extents. The engine owns both the sheet-axis→frame-axis remap and the half-extent clamp, for the boundary and for every per-line answer.
- Edge cut-off arithmetic (counted ladder lines + sheet margins → warnings and a sheet-axis hold-in line) moves from the demo into the package's calibration entry point, as a producer of hold-in lines. Its "no profile moves where the printer stops" rule is engine knowledge.
- A new `offby2/web` entry point ships the browser conveniences: the CSS custom-property map for a boundary, and an element-readback shim for the pixel agreement check. Adapters contain zero arithmetic — the quarter-turn padding reassignment and the comparison itself are core judgements over plain data; the shim only gathers numbers.
- DOM types never appear in the core interface; the core has no React, DOM, or framework dependency and runs anywhere.
- Policy for *choosing* hold-in lines — such as the demo auto layout's raise-padding-to-a-target rule — stays in the host. The engine says where lines sit, never which lines a design should want.
- The CSS custom-property names emitted by the web adapter become package interface and are documented as such.
- The demo rewires its preview, fit measurement, print options, and PDF placement to consume the engine, then deletes its own boundary module, its local axis swaps, and its re-clamps. Build order: core + tests green, then the web entry, then demo call sites one at a time, deletions last.
- Domain vocabulary (already recorded): **hold-in line**, **content boundary**, **edge cut-off allowance** in CONTEXT.md; the term "safe area" is retired to the avoid list.

## Testing Decisions

- Tests exercise external behaviour only, through the package's public entry points — the interface is the test surface. No test reaches past an entry point into engine internals.
- Primary seam: the main entry's `contentBoundary`. Migrate the demo's existing content-inset and edge-cut-off example tests here, and add the cases that previously lived unguarded in wiring: a sideways frame with unequal sheet-axis allowances (the remap), lines that cross (inset inside the cut-off line on one axis, outside on the other), and a frame narrow enough to trigger the clamp.
- One property test at the same seam: for generated line sets and frames, the boundary per axis equals the most obtrusive held line, and rotating the frame while swapping sheet-axis line coordinates leaves the answer unchanged.
- Second seam: the calibration entry, testing the edge cut-off line producer (counts + margins → warnings and allowance), migrated from the demo's tests.
- Third seam: the web entry, tested as pure formatting — assert the custom-property map for a few boundaries. The element-reading shim stays a four-line untested gatherer; it contains no arithmetic by design. The package's test environment stays plain Node — no jsdom.
- No demo-side test seams are added; the demo is verified by typecheck and build, and ends the work with less test surface than it started with.
- Prior art: the package's existing vitest suites for sheet-layout math (label positions) are the model — pure-data example tests at entry-point level.

## Out of Scope

- Auto layout and its padding-target policy (a separate deepening candidate).
- The calibration sheet display list (candidate 3 of the architecture review).
- The label scene / printable-output token source (candidate 4), and any golden-byte PDF testing.
- Shrinking the demo's shallow print-tab interfaces (candidate 5) beyond the call-site rewiring this work requires.
- A React hooks adapter entry point (deferred until a real consumer wants it).
- A jsdom test environment for the demo application.
- Any change to how printer profiles, placement bias, or profile compatibility are modelled.

## Further Notes

- ADR-0007 records the decision and amends ADR-0002 ("app first, package later" — later is now). ADR-0001's line survives in spirit: hosts still own presentation; the package merely ships optional presentation *conveniences* that contain no domain arithmetic.
- The retired symmetric safe-area function should be removed or clearly deprecated in the same change that introduces the boundary, so the engine never tells two stories at once.
- The demo's docstring language ("each is a line, and content stops at whichever sits furthest in") is the canonical phrasing; carry it into the engine's documentation.
