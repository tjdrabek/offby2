# Define the standalone application workspace

Type: grilling
Status: resolved
Blocked by: 05, 08, 11

## Question

What durable user-facing records and navigation should organize sheet layouts, printing setups, label content templates, per-label data, partially used sheets, previews, generated printable output, and history in the personal web application?

## Answer

The home screen centers recent label projects. A label project contains its selected sheet-layout revision, label content templates, per-label data and overrides, content-inset settings, and position assignments. It references printing setups and printer profiles rather than copying them.

Position selection may be ad hoc, or a user may save a named sheet instance representing one identifiable physical sheet and its used positions. Reuse always requires reconfirming physical condition, loading procedure, and leading edge; saved state never claims that refeeding is safe.

Each generated PDF creates a lightweight print preparation containing the project snapshot, printable-output hash, timestamp, sheet-layout revision, selected positions, printer-profile identity, compatibility result, setup attestation, print configuration, overrides, and diagnostics. Download does not assert physical printing.

Editors autosave recoverable drafts, provide session undo and redo, and create explicit named snapshots at meaningful boundaries rather than permanent revisions for every edit. Exports include current state and named snapshots.

The application shell provides Projects, Sheet layouts, Printing setups and calibration, Assets, and Settings and backup. A project uses the iterative path Content, Sheet, Preview, and Prepare PDF. Calibration is a guided workflow launched when required, not a mandatory project step.
