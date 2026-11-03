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
| `offby2/web` | Browser conveniences: the boundary's CSS custom-property map (`--offby2-boundary-x`/`-y`, `--offby2-line-<name>-x`/`-y`, percent of frame extent) and the element readback shim for the pixel agreement check. |

## The shapes it creates

Every value the package produces is one of a small set of shapes. Dimensions
are branded `Millimetres` — a `number` a raw value cannot pose as, so entered
text can never leak into geometry unparsed.

**`SheetLayoutResolution`** — the one result `resolveSheetLayout` returns:

```ts
type SheetLayoutResolution =
  | { status: "resolved"; layout: ResolvedSheetLayout }
  | { status: "unresolved"; issues: SheetLayoutIssue[]; derivation: AxisDerivationResults }
  | { status: "refused"; refusals: SheetGeometryRefusal[] };
```

**`ResolvedSheetLayout`** — everything a resolved input yields, including which
values were worked out rather than entered:

```ts
interface ResolvedSheetLayout {
  counts: Record<CountFieldId, number>;
  // Each measurement discloses whether it was parsed from text or derived.
  measurements: Record<MeasurementFieldId, ParsedMeasurement | DerivedMeasurement>;
  cornerRadius: ParsedMeasurement | null; // null for the zero and unknown states
  derivations: SheetLayoutDerivation[];   // at most one per axis; empty if all entered
  geometry: SheetGeometry;                // the same values, judged and accepted
}
```

**`SheetGeometry`** — normalized, validated millimetre geometry. This is the
shape previews, PDF writers, and calibration all consume:

```ts
interface SheetGeometry {
  sheet: { widthMm: Millimetres; heightMm: Millimetres };
  grid: { rows: number; columns: number };
  label: { widthMm: Millimetres; heightMm: Millimetres };
  margins: { topMm: Millimetres; rightMm: Millimetres; bottomMm: Millimetres; leftMm: Millimetres };
  gaps: { horizontalMm: Millimetres; verticalMm: Millimetres };
  // Four states: "unknown" (nobody measured) is a different claim from "zero".
  cornerRadius:
    | { state: "zero" }
    | { state: "known"; radiusMm: Millimetres }
    | { state: "estimated"; radiusMm: Millimetres }
    | { state: "unknown" };
}
```

**`SheetLayoutIssue`** — one problem, tied to the field it belongs to, ready to
render next to it (`issuesByField` groups them):

```ts
interface SheetLayoutIssue {
  field: SheetLayoutFieldId; // "sheetWidth", "rows", "cornerRadius", …
  code: SheetLayoutIssueCode; // "required", "measurement-malformed", …
  message: string;            // wording to show the operator
}
```

**`LabelPosition`** — where one label lands, from `labelPositions(geometry)`:

```ts
interface LabelPosition {
  index: number;  // reading order: left to right, then top to bottom
  row: number;
  column: number;
  xMm: number;    // from the sheet's left edge
  yMm: number;    // from the sheet's top edge
  widthMm: number;
  heightMm: number;
  cornerRadiusMm: number | null;
}
```

**Calibration shapes** (`offby2/calibration`) — a plan to print, and the
profile derived from measuring it:

```ts
interface CalibrationSheetPlan {
  placement: MarkPlacement;     // which mark placement produced this plan
  sheet: { widthMm: number; heightMm: number };
  targets: CalibrationTarget[]; // id, operator-facing label, intended centre x/y
                                // (grid row/column only under "corner-label-centre")
  markLengthMm: number;         // crosshair arm length, for a renderer
}

interface PrinterProfile {
  setupId: string;                      // opaque host identity of the printing setup
  layoutRevision: SheetLayoutRevisionRef; // the exact revision it was measured against
  translationMm: { xMm: number; yMm: number }; // the whole correction — translation only
  evidence: "preliminary" | "confirmed";  // one sheet vs. repeated sheets that agreed
  sheetCount: number;
  worstTargetDisagreementMm: number;    // proof the correction really is a translation
  worstSheetVariationMm: number;
  createdAt: number;
}
```

## Building a form: `offby2/fields`

The input model is plain serializable state, so a React form is one `useState`
plus one `resolveSheetLayout` per render. Field definitions carry their own
labels and grouping — the form renders what the package declares rather than
hard-coding a field list, and issues attach to the control they belong to:

```tsx
import { useMemo, useState } from "react";
import {
  createEmptySheetLayoutInput,
  issuesByField,
  resolveSheetLayout,
} from "offby2";
import {
  COUNT_FIELDS,
  LENGTH_UNITS,
  MEASUREMENT_FIELDS,
  convertInputUnits,
  lengthUnitSuffix,
} from "offby2/fields";
import type { LengthUnit, MeasurementFieldId, CountFieldId } from "offby2";

export function SheetLayoutForm() {
  const [unit, setUnit] = useState<LengthUnit>("mm");
  const [input, setInput] = useState(() => createEmptySheetLayoutInput("mm"));

  // Resolution is pure and fast: run it on every keystroke.
  const result = useMemo(() => resolveSheetLayout(input), [input]);
  const issues =
    result.status === "unresolved" ? issuesByField(result.issues) : undefined;

  const setMeasurement = (id: MeasurementFieldId, text: string) =>
    setInput((prev) => ({
      ...prev,
      measurements: { ...prev.measurements, [id]: { text, unit } },
    }));

  const setCount = (id: CountFieldId, text: string) =>
    setInput((prev) => ({ ...prev, counts: { ...prev.counts, [id]: { text } } }));

  // Converts every readable value to the new unit losslessly; text that is
  // still being corrected survives as typed.
  const switchUnit = (next: LengthUnit) => {
    setUnit(next);
    setInput((prev) => convertInputUnits(prev, next));
  };

  return (
    <form>
      <select value={unit} onChange={(e) => switchUnit(e.target.value as LengthUnit)}>
        {LENGTH_UNITS.map((o) => (
          <option key={o.unit} value={o.unit}>{o.label}</option>
        ))}
      </select>

      {MEASUREMENT_FIELDS.map((field) => (
        <label key={field.id}>
          {field.label} ({lengthUnitSuffix(unit)})
          <input
            value={input.measurements[field.id].text}
            onChange={(e) => setMeasurement(field.id, e.target.value)}
            aria-invalid={issues?.has(field.id) ?? false}
          />
          {issues?.get(field.id) && <span role="alert">{issues.get(field.id)!.message}</span>}
        </label>
      ))}

      {COUNT_FIELDS.map((field) => (
        <label key={field.id}>
          {field.label}
          <input
            inputMode="numeric"
            value={input.counts[field.id].text}
            onChange={(e) => setCount(field.id, e.target.value)}
          />
        </label>
      ))}
    </form>
  );
}
```

Leave one dimension blank per axis and `resolveSheetLayout` supplies it: enter
the sheet size, counts, margins and gaps, and the label size comes out of the
axis equations — `result.layout.derivations` says what was worked out.

### Drawing the sheet as it is entered

`resolveSheetLayout` says no until every entry is in. A figure beside the
fields should not wait that long: the paper is drawable the moment its two
extents parse, each margin can shade its strip as it is typed, and because the
two axis equations share no term, an axis whose entries are all in can lay its
labels out before the other axis has a count. `sketchSheetLayout` is that
reading — the same parser, derivation and per-axis judgement the resolver
uses, reported as whatever is known now:

```ts
import { sketchSheetLayout } from "offby2";

const sketch = sketchSheetLayout(input);
sketch.sheet;          // { widthMm, heightMm } — null until each parses
sketch.margins;        // each margin, or null
sketch.horizontal;     // one of three, per axis:
//   { status: "laid-out",   layout: { extentMm, leadingMm, sizeMm, gapMm, trailingMm, count, derived } }
//   { status: "incomplete", missing: ["horizontalGap", "columns"] }
//   { status: "refused",    code, fields, message }  // every field on the axis, in the entry unit
sketch.geometry;       // the resolver's SheetGeometry once it resolves, else null
```

A refusal's `fields` lists the whole axis — a label width that derives negative
is wrong because of something among the paper, the margins, the gap or the
count, and the figure's job is to light that axis rather than to guess which.
Every figure in a refusal message, here and from `resolveSheetLayout`, is
written in the unit the sheet was entered in.

## Placing content that fits

A `resolved` result is everything a renderer needs. `labelPositions` says
where each label is; `contentBoundary` answers where content stops inside
it — the content boundary. Several things hold content in from the label
edge (an alignment tolerance, an edge cut-off allowance, a design's own
content inset); they do not add. Each is a named hold-in line, and content
stops at whichever line sits furthest in, per axis:

```tsx
import { contentBoundary, labelPositions, sheetExtent } from "offby2";
import type { HoldInLine, ResolvedSheetLayout } from "offby2";

// What your printing setup cannot guarantee. 1 mm is a fair uncalibrated
// default; a confirmed PrinterProfile is the evidence for a smaller number.
const ALIGNMENT_TOLERANCE: HoldInLine = {
  axes: "sheet",
  xMm: 1,
  yMm: 1,
};

export function SheetWithContent({ layout }: { layout: ResolvedSheetLayout }) {
  const sheet = sheetExtent(layout.geometry);
  return (
    // millimetre viewBox: every package value is usable as-is, no scaling math.
    <svg viewBox={`0 0 ${sheet.widthMm} ${sheet.heightMm}`}>
      {labelPositions(layout.geometry).map((label) => {
        const boundary = contentBoundary(
          { tolerance: ALIGNMENT_TOLERANCE },
          { orientation: "upright", widthMm: label.widthMm, heightMm: label.heightMm },
        );
        return (
          <g key={label.index}>
            <rect
              x={label.xMm} y={label.yMm}
              width={label.widthMm} height={label.heightMm}
              rx={label.cornerRadiusMm ?? 0}
              fill="none" stroke="currentColor" strokeWidth={0.2}
            />
            {/* Anything constrained to the content boundary is guaranteed to fit. */}
            <foreignObject
              x={label.xMm + boundary.xMm}
              y={label.yMm + boundary.yMm}
              width={label.widthMm - boundary.xMm * 2}
              height={label.heightMm - boundary.yMm * 2}
            >
              <div style={{ overflow: "hidden", width: "100%", height: "100%" }}>
                Label {label.index + 1}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
```

The same numbers drive a PDF writer: `LabelPosition` and the content boundary
are plain millimetres from the label's own top-left corner, and a calibrated
setup passes its profile — `labelPositions(geometry, profile)` — to shift
every position by the measured correction before rendering.

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
`fields.ts`, `calibration.ts`, `presets.ts`, `web.ts`), published from `lib/` via
`npm run build:package`. Anything not reachable from an entry point is not
part of the package.

```sh
npm test              # the domain's test suite
npm run build:package # emit lib/ for publishing
```

## Status

The 1.0 surface was frozen against a real consumer — the `offby2-demo`
application, which exercises the workflow, fields, calibration planning and
derivation, presets, and web entry points end to end.

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
import { planCalibrationSheet, derivePrinterProfile } from "offby2/calibration";

// 1. Marks at the corners of the grid, with the positions they should print at.
const plan = planCalibrationSheet(geometry);

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
