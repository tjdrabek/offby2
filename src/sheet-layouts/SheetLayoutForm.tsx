import { useId, useRef, useState, type FormEvent } from "react";
import SheetLayoutField from "./SheetLayoutField";
import CornerRadiusField from "./CornerRadiusField";
import StatusRegion from "../ui/StatusRegion";
import {
  CORNER_RADIUS_STATES,
  COUNT_FIELDS,
  DEFAULT_LENGTH_UNIT,
  LENGTH_UNITS,
  MEASUREMENT_FIELDS,
  createEmptySheetLayoutInput,
  lengthUnitSuffix,
  withCornerRadiusState,
  withMeasurementUnit,
  type CornerRadiusStateId,
  type CountFieldId,
  type LengthUnit,
  type MeasurementFieldId,
  type MeasurementGroup,
  type SheetLayoutFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput";
import {
  issuesByField,
  type SheetLayoutIssue,
} from "./validateSheetLayoutInput";
import {
  resolveSheetLayout,
  type ResolvedSheetLayout,
} from "./resolveSheetLayout";
import NormalizedMeasurements from "./NormalizedMeasurements";
import { formatMeasurement } from "./measurementUnits";
import "./SheetLayoutForm.css";

interface SheetLayoutFormProps {
  /**
   * Receives the source input and its resolved millimetres once the entry is
   * representable as uniform-grid geometry, whether every value was typed or
   * one of them was derived.
   */
  onSubmit?: (
    input: SheetLayoutSourceInput,
    resolved: ResolvedSheetLayout,
  ) => void;
}

const GROUP_LEGENDS: Record<MeasurementGroup, string> = {
  sheet: "Sheet",
  grid: "Label grid",
  margins: "Margins",
  gaps: "Gaps between labels",
};

/** Order the fields are shown and reported in; counts sit with the grid they describe. */
const GROUP_ORDER: readonly MeasurementGroup[] = [
  "sheet",
  "grid",
  "margins",
  "gaps",
];

function cornerRadiusLabel(state: CornerRadiusStateId): string {
  return (
    CORNER_RADIUS_STATES.find((option) => option.state === state)?.label ??
    state
  );
}

/**
 * Captures every dimension of a uniform-grid sheet layout: sheet size, row and
 * column counts, label size, four independent margins, both gaps, and the
 * four-state corner-radius disclosure.
 *
 * Entries are kept as typed text with an explicit unit until they are checked,
 * so nothing the user typed is lost or silently corrected.
 */
function SheetLayoutForm({ onSubmit }: SheetLayoutFormProps) {
  const [unit, setUnit] = useState<LengthUnit>(DEFAULT_LENGTH_UNIT);
  const [input, setInput] = useState<SheetLayoutSourceInput>(() =>
    createEmptySheetLayoutInput(DEFAULT_LENGTH_UNIT),
  );
  const [issues, setIssues] = useState<
    ReadonlyMap<SheetLayoutFieldId, SheetLayoutIssue>
  >(new Map());
  const [summary, setSummary] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  // Held from the last accepted check. Changing the display unit re-reads the
  // form's labels, never this: normalized geometry is not display state.
  const [resolved, setResolved] = useState<ResolvedSheetLayout | null>(null);
  const unitId = useId();
  const headingId = useId();

  // Controls are found by their field marker when a refusal needs to move
  // focus, which keeps every field a plain controlled input.
  const formRef = useRef<HTMLFormElement>(null);

  const suffix = lengthUnitSuffix(unit);

  function changeUnit(next: LengthUnit) {
    setUnit(next);
    setInput((current) => withMeasurementUnit(current, next));
  }

  function changeMeasurement(field: MeasurementFieldId, text: string) {
    setInput((current) => ({
      ...current,
      measurements: {
        ...current.measurements,
        [field]: { ...current.measurements[field], text },
      },
    }));
  }

  function changeCount(field: CountFieldId, text: string) {
    setInput((current) => ({
      ...current,
      counts: { ...current.counts, [field]: { text } },
    }));
  }

  function changeCornerRadiusState(state: CornerRadiusStateId) {
    setInput((current) => withCornerRadiusState(current, state, unit));
  }

  function changeCornerRadiusValue(text: string) {
    setInput((current) =>
      current.cornerRadius.state === "known" ||
      current.cornerRadius.state === "estimated"
        ? {
            ...current,
            cornerRadius: {
              state: current.cornerRadius.state,
              value: { ...current.cornerRadius.value, text },
            },
          }
        : current,
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resolution = resolveSheetLayout(input);
    if (resolution.status === "unresolved") {
      setIssues(issuesByField(resolution.issues));
      setStatus(null);
      const count = resolution.issues.length;
      setSummary(
        `${count} measurement${count === 1 ? "" : "s"} still ${count === 1 ? "needs" : "need"} attention. Each one is described under its own field.`,
      );
      // A refused entry has no normalized result; keeping the previous one on
      // screen would state a value the form has just declined to accept.
      setResolved(null);
      focusField(resolution.issues[0].field);
      return;
    }
    const { layout } = resolution;
    setIssues(new Map());
    setSummary(null);
    setResolved(layout);
    const derived = layout.derivation
      ? ` ${layout.derivation.label} was derived as ${formatMeasurement(layout.derivation.valueMm, "mm")}, not entered.`
      : "";
    setStatus(
      `Measurements captured: ${layout.counts.rows} rows by ${layout.counts.columns} columns. Corner radius: ${cornerRadiusLabel(input.cornerRadius.state)}.${derived}`,
    );
    onSubmit?.(input, layout);
  }

  function focusField(field: SheetLayoutFieldId) {
    formRef.current
      ?.querySelector<HTMLInputElement>(`[data-field="${field}"]`)
      ?.focus();
  }

  const derivation = resolved?.derivation ?? null;

  function renderMeasurements(group: MeasurementGroup) {
    return MEASUREMENT_FIELDS.filter((field) => field.group === group).map(
      (field) => (
        <SheetLayoutField
          key={field.id}
          field={field.id}
          label={`${field.label} (${suffix})`}
          value={input.measurements[field.id].text}
          issue={issues.get(field.id)}
          derivation={derivation?.field === field.id ? derivation : undefined}
          displayUnit={unit}
          onChange={(text) => changeMeasurement(field.id, text)}
        />
      ),
    );
  }

  return (
    <form
      className="sheet-layout-form"
      ref={formRef}
      aria-labelledby={headingId}
      onSubmit={handleSubmit}
    >
      <h2 id={headingId}>Sheet measurements</h2>
      <p className="sheet-layout-note">
        Supported media is a rectangular sheet carrying a uniform grid of
        identical square or rounded-rectangle labels. Sheets with labels of
        differing sizes, or with circular, oval, roll, continuous, or other
        die-cut shapes, cannot be described here.
      </p>

      {summary && (
        <p role="alert" className="sheet-layout-error-summary">
          {summary}
        </p>
      )}

      <div className="sheet-layout-field">
        <label htmlFor={unitId}>Measurement unit</label>
        <select
          id={unitId}
          value={unit}
          onChange={(event) => changeUnit(event.target.value as LengthUnit)}
        >
          {LENGTH_UNITS.map((option) => (
            <option key={option.unit} value={option.unit}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {GROUP_ORDER.map((group) => (
        <fieldset className="sheet-layout-fieldset" key={group}>
          <legend>{GROUP_LEGENDS[group]}</legend>
          {group === "grid" &&
            COUNT_FIELDS.map((field) => (
              <SheetLayoutField
                key={field.id}
                field={field.id}
                label={field.label}
                value={input.counts[field.id].text}
                issue={issues.get(field.id)}
                onChange={(text) => changeCount(field.id, text)}
              />
            ))}
          {renderMeasurements(group)}
        </fieldset>
      ))}

      <CornerRadiusField
        value={input.cornerRadius}
        issue={issues.get("cornerRadius")}
        onStateChange={changeCornerRadiusState}
        onValueChange={changeCornerRadiusValue}
      />

      {/* Kept beside the action that fills it, so the outcome is visible where
          the user is standing as well as announced. */}
      <StatusRegion label="Sheet layout status" className="sheet-layout-status">
        {status}
      </StatusRegion>
      <button className="sheet-layout-submit" type="submit">
        Check measurements
      </button>

      {resolved && (
        <>
          <NormalizedMeasurements layout={resolved} displayUnit={unit} />
          <p className="sheet-layout-note">
            Millimetres are the values this layout is stored and measured in.
            The measurement unit above is a display preference: changing it
            restates the entry fields, and never changes a captured value.
          </p>
        </>
      )}
    </form>
  );
}

export default SheetLayoutForm;
