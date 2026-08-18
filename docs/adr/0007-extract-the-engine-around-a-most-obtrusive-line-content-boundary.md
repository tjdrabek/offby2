# Extract the engine around a most-obtrusive-line content boundary

Status: accepted · amends ADR-0002

The demo application is the concrete consumer ADR-0002 was waiting for, and the goal is an engine any UI can attach to without reimplementing placement math. The package therefore begins growing a public engine interface, starting with the content boundary: content stops at the most obtrusive hold-in line per design-frame axis — hold-in lines (content inset, edge cut-off allowance, alignment tolerance) do not add — replacing the additive tolerance model behind `safeArea()`, which is reimplemented on top of it or deprecated. The core stays pure data-in, data-out; browser conveniences (the CSS custom-property map, element readback for the px agreement check) ship as an optional `offby2/web` entry point that contains no arithmetic. Policy for choosing hold-in lines (such as auto layout's padding targets) stays with the host.

## Considered options

- Keep the boundary demo-local (rejected: every future UI reimplements the axis remap — the exact bug surface being removed).
- Parameterize `safeArea()` with per-axis and max-vs-add options (rejected: widens an interface instead of deepening a module).
- Put DOM types in the core interface (rejected: ties the engine to browser UIs and drags jsdom into its test surface for no depth gain).
