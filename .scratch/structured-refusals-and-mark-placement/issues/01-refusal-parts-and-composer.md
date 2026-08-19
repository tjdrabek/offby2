# 01 — Refusals carry explanation and remedies as parts

**What to build:** Everywhere the sheet-layout entry says no with prose — the required-value issue, count and measurement validation issues, and every derivation refusal — the value carries an explanation (what happened and why) and a list of remedies, each remedy naming the action it asks for (entering the field's value, or checking the other values on the axis) alongside that remedy's prose fragment. A single package composer produces the full `message` from those parts, so a host that wants one line gets exactly what it gets today, while a structured host can filter remedies by action code before composing. Explanation-only is a valid shape, not a special case. Existing consumers see byte-identical prose.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Every refusal and validation issue from the sheet-layout entry exposes an explanation and a (possibly empty) list of remedies, each remedy carrying an action code and its prose fragment.
- [x] The composed `message` remains on the value and equals the package composer applied to the parts — the sentence a host shows and the parts it filters can never tell different stories.
- [x] Message composition lives in the package once; the composer is public so a host that filters remedies can still let the package speak.
- [x] The historical prose is pinned through the composed message in the existing resolution and derivation suites: every current wording survives the restructuring byte for byte.
- [x] Tests exercise external behaviour only, through the package's public entry points, extending the existing pure-data example suites.

## Comments

`explanation`/`remedies` landed on `SheetLayoutIssue` (validateSheetLayoutInput.ts), `MeasurementParseFailure` (parseMeasurement.ts), and the `refused` branch of `SheetLayoutDerivationResult` (deriveDimension.ts). `refusalMessage.ts` holds `RefusalRemedy`, `RefusalMessage`, `ENTER_VALUE_REMEDY`, and the two public composers (`composeRemedies`, `composeRefusalMessage`). Geometry refusals (`validateSheetGeometry.ts`) were left explanation-only — the ticket's list names the required-value issue, count/measurement validation, and derivation refusals specifically, not geometry refusals, and nothing there needed a filterable remedy. Every existing suite passes unchanged in shape (only `toEqual`s that pinned the old exact issue shape were widened to `toMatchObject` or given the new fields), plus new tests assert `composeRefusalMessage({explanation, remedies}) === message` and that filtering the `enter-value` remedy off a derivation refusal still composes a complete sentence. Full package suite: 353/353 tests, typecheck clean, lint clean; demo repo (existing consumer) typechecks, lints, and passes 122/122 tests unchanged against the rebuilt package.
