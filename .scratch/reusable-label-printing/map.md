# Find the way to reliable reusable label printing

Label: wayfinder:map

## Destination

A validated specification for a framework-neutral browser npm package and first-party React integration that places user-controlled content on rectangular label sheets within documented alignment tolerances, backed by focused prototypes and physical evidence where equipment is available.

## Notes

- Consult the `/domain-modeling` skill in every decision session and preserve the vocabulary in [CONTEXT.md](../../CONTEXT.md).
- Planning is the default: resolve design decisions and investigations, but do not build the production package.
- The core is content-agnostic. QR-plus-text is representative validation content only.
- The package owns serializable schemas and replaceable persistence abstractions; consuming applications own storage policy.
- The package should own a calibration workflow and offer optional headless React components/hooks. Applications retain styling and profile persistence.
- React is the first fully specified integration. Future Vue and other adapters must remain possible, but their implementations are outside this effort.
- Target ordinary desktop browser print dialogs. Do not claim that browser code can identify or control a physical printer unless research proves otherwise.

## Decisions so far

- [Establish browser printing constraints](issues/01-browser-printing-constraints.md) — Standard browser printing can express CSS layout and open the dialog, but printer discovery, dialog control, and physical-output guarantees remain outside page-script control.
- [Identify printer alignment variables](issues/02-printer-alignment-variables.md) — Calibrate only empirically stable setup-specific transforms, beginning with x/y translation; treat feed variation, loading, media, mechanics, and changed settings as tolerance or operator concerns.

## Not yet specified

- The supported desktop-browser matrix and defensible alignment-tolerance claims, once research and physical evidence exist.
- The core public API, React API, and future framework-adapter contract, once package boundaries, sheet geometry, persistence, and calibration needs are settled.
- The validation strategy and implementation handoff shape, once the supported behavior and measurable claims are clear.

## Out of scope

- Production implementation and publication of the npm package.
- First-party Vue or other non-React framework integrations.
- Direct printer communication or automatic physical-printer identification.
- Mobile-browser, roll/thermal, continuous-media, duplex, and non-rectangular-label printing.
