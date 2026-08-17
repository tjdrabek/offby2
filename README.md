# offby2

Sheet layouts for label printing.

A label sheet is a grid of die-cut rectangles, and getting content onto them
means describing that grid exactly. `offby2` reads what an operator entered,
works out the one dimension they left blank, and refuses a sheet that cannot
exist — before anything is stored, previewed, or printed.

It is pure: no React, no DOM, no storage, no PDF writer. A host application owns
presentation and durability; the operator and their printer own everything
physical.

## Install

```sh
npm install offby2
```

## The one call most consumers need

```ts
import { createEmptySheetLayoutInput, resolveSheetLayout } from "offby2";

const input = {
  ...createEmptySheetLayoutInput("mm"),
  // …fields filled in from a form
};

const result = resolveSheetLayout(input);

switch (result.status) {
  case "resolved":
    // result.layout.geometry is normalized, validated, millimetre geometry.
    // result.layout.derivation says which value, if any, was worked out.
    break;
  case "unresolved":
    // result.issues points at the fields that are missing or unreadable.
    break;
  case "refused":
    // Every entry was readable, but the sheet they describe cannot exist:
    // labels overlap, run off the sheet, or contradict the sheet extent.
    break;
}
```

`resolveSheetLayout` runs validation, derivation, and geometry checking in the
only order that makes sense, so a derived value is never shown while some other
entry is still wrong. The steps themselves are not exported — the one call is
the API.

The package is split by job, so a consumer imports only what they are building:

| Entry | Job |
| --- | --- |
| `offby2` | The workflow: start an input, resolve it, read the result, place labels. |
| `offby2/fields` | Building an entry form: field definitions, units, parsing and formatting entries. |
| `offby2/calibration` | Measuring where a printing setup puts content, and correcting for it. |
| `offby2/presets` | Published figures for common label products and standard sheet sizes. |

## Building a form: `offby2/fields`

Field definitions carry their own labels and grouping, so a host renders what
the package declares rather than hard-coding a field list:

```ts
import {
  MEASUREMENT_FIELDS,
  LENGTH_UNITS,
  parseMeasurement,
  convertInputUnits,
  formatMeasurement,
} from "offby2/fields";

// One input per definition; each knows its group ("sheet", "grid", …) and label.
for (const field of MEASUREMENT_FIELDS) {
  render(field.id, field.label, field.group);
}

// Validate a single entry as it is typed.
const parsed = parseMeasurement("sheetWidth", input.measurements.sheetWidth);
if (parsed.status === "invalid") show(parsed.message);

// Switch display units without corrupting the values: every readable entry is
// rewritten as the shortest text that still means the same measurement.
const inInches = convertInputUnits(input, "in");

// Show a normalized value back to the operator: "63.5 mm".
formatMeasurement(layout.geometry.label.widthMm, "mm");
```

## Starting from a preset: `offby2/presets`

Presets are published figures for common label products — entries to be
validated, not trusted geometry. Each one is a `SheetLayoutSourceInput` that
still goes through `resolveSheetLayout` like anything an operator typed:

```ts
import { sheetLayoutPreset, matchStandardSheetSize } from "offby2/presets";
import { resolveSheetLayout } from "offby2";

const preset = sheetLayoutPreset("avery-5160");
if (preset) {
  const result = resolveSheetLayout(preset.input);
}

// Recognize a sheet the operator described by hand: A4, Letter, …
const standard = matchStandardSheetSize(210, 297);
```

## Two distinctions worth knowing

**Entered values are not geometry.** `SheetLayoutSourceInput` is exactly what
the operator typed — text plus the unit it was typed in — so an invalid entry
can always be shown back for correction. Normalized geometry uses branded
`Millimetres`, which a raw number cannot satisfy.

**An unknown corner radius is not a zero radius.** `CornerRadiusDisclosure` has
four states: `zero` says the corners are square, `unknown` says nobody has
measured them. `cornerRadiusMm` returns `null` for `unknown` rather than a zero
that would quietly assert square corners.

## What this does not represent

Only rectangular sheets carrying a uniform grid of identical square or
rounded-rectangle labels. Circular, oval, non-uniform, roll, continuous, and
arbitrary die-cut media have no representation here by construction —
see `UNSUPPORTED_MEDIA` for the wording to show an operator who asks for one.

Nothing here inspects a printer, enforces a print dialog, or asserts that
physical printing occurred.

## This repository

The package source is `src/`, with one file per entry point (`index.ts`,
`fields.ts`, `calibration.ts`, `presets.ts`), published from `lib/` via
`npm run build:package`. Anything not reachable from an entry point is not
part of the package.

```sh
npm test              # the domain's test suite
npm run build:package # emit lib/ for publishing
```

## Status

Pre-release, unpublished. The surface is being tried out against a real
consumer before it is frozen — see the `offby2-demo` repository, which consumes
this package as a local dependency.

Calibration is partly here: the marks a calibration sheet carries, the
observations an operator records, and the derivation of a printer profile from
them. What is not here is the rest of the workflow — printing setups as
anything more than an opaque id, the calibration draft lifecycle, profile
compatibility beyond a revision match, pagination, and deterministic PDF
output. Rendering and printing the calibration sheet belong to the host.

Every threshold in `PROVISIONAL_CALIBRATION_POLICY` is a placeholder. The
physical baseline that would justify real numbers has not been measured.

## Calibration

```ts
import { labelPositions } from "offby2";
import { calibrationSheet, derivePrinterProfile } from "offby2/calibration";

// 1. Marks at the corners of the grid, with the positions they should print at.
const plan = calibrationSheet(geometry);

// 2. The host renders and prints it; the operator measures where each mark
//    actually landed, from the sheet's left and top edges.
const result = derivePrinterProfile({
  plan,
  layoutRevision,
  setupId,
  sets: [{ sheetOrdinal: 1, provenance: "physical", recordedAt: Date.now(), observations }],
  now: Date.now(),
});

// 3. A profile corrects the positions sent to the printer. The sheet layout is
//    never modified: it describes the label stock, not the printer.
if (result.status === "derived") {
  const corrected = labelPositions(geometry, result.profile);
}
```

The correction is a whole-sheet x/y translation and nothing else. Marks that
disagree with each other mean the sheet was scaled or rotated, and derivation
refuses rather than averaging that into a plausible-looking shift. One sheet
yields `evidence: "preliminary"`; repeated sheets that agree yield
`"confirmed"`. Measurements marked `provenance: "demo"` never produce a profile.
