import {
  MEASUREMENT_FIELDS,
  lengthUnitSuffix,
  type LengthUnit,
  type SheetLayoutFieldId,
} from "./SheetLayoutInput";
import { formatMillimetres } from "./measurementUnits";
import type {
  ResolvedMeasurement,
  ResolvedSheetLayout,
} from "./resolveSheetLayout";

interface NormalizedMeasurementsProps {
  layout: ResolvedSheetLayout;
  /** Presentation only: the unit new entries are read in and results restated in. */
  displayUnit: LengthUnit;
}

/** What the "As entered" column says — a derived value was never entered. */
function sourceText(measurement: ResolvedMeasurement): string {
  return measurement.status === "derived"
    ? "Derived, not entered"
    : `${measurement.source.text} ${lengthUnitSuffix(measurement.source.unit)}`;
}

/**
 * Shows what each entry normalized to, next to exactly what was typed.
 *
 * Millimetres are the authoritative column and never change. The display-unit
 * column is derived from those millimetres for reading convenience only —
 * nothing converts it back, so its rounding cannot reach stored geometry. A
 * value the sheet equation supplied says so in its own row, so it is never read
 * as something the user measured.
 */
function NormalizedMeasurements({
  layout,
  displayUnit,
}: NormalizedMeasurementsProps) {
  const rows: {
    key: SheetLayoutFieldId;
    label: string;
    measurement: ResolvedMeasurement;
  }[] = MEASUREMENT_FIELDS.map((field) => ({
    key: field.id,
    label: field.label,
    measurement: layout.measurements[field.id],
  }));
  if (layout.cornerRadius) {
    rows.push({
      key: "cornerRadius",
      label: "Corner radius",
      measurement: layout.cornerRadius,
    });
  }
  const showsDisplayUnit = displayUnit !== "mm";

  return (
    <table className="sheet-layout-normalized" data-testid="normalized">
      <caption>Normalized measurements</caption>
      <thead>
        <tr>
          <th scope="col">Measurement</th>
          <th scope="col">As entered</th>
          <th scope="col">Millimetres</th>
          {showsDisplayUnit && (
            <th scope="col">Shown in {lengthUnitSuffix(displayUnit)}</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ key, label, measurement }) => (
          <tr key={key} data-derived={measurement.status === "derived"}>
            <th scope="row">{label}</th>
            <td>{sourceText(measurement)}</td>
            <td data-field-mm={key}>
              {formatMillimetres(measurement.valueMm, "mm")} mm
            </td>
            {showsDisplayUnit && (
              <td>
                {formatMillimetres(measurement.valueMm, displayUnit)}{" "}
                {lengthUnitSuffix(displayUnit)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default NormalizedMeasurements;
