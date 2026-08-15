import {
  MEASUREMENT_FIELDS,
  lengthUnitSuffix,
  type LengthUnit,
  type SheetLayoutFieldId,
} from "./SheetLayoutInput";
import { formatMillimetres } from "./measurementUnits";
import type { ParsedMeasurement } from "./parseMeasurement";
import type { NormalizedSheetLayout } from "./validateSheetLayoutInput";

interface NormalizedMeasurementsProps {
  layout: NormalizedSheetLayout;
  /** Presentation only: the unit new entries are read in and results restated in. */
  displayUnit: LengthUnit;
}

/**
 * Shows what each entry normalized to, next to exactly what was typed.
 *
 * Millimetres are the authoritative column and never change. The display-unit
 * column is derived from those millimetres for reading convenience only —
 * nothing converts it back, so its rounding cannot reach stored geometry.
 */
function NormalizedMeasurements({
  layout,
  displayUnit,
}: NormalizedMeasurementsProps) {
  const rows: {
    key: SheetLayoutFieldId;
    label: string;
    parsed: ParsedMeasurement;
  }[] = MEASUREMENT_FIELDS.map((field) => ({
    key: field.id,
    label: field.label,
    parsed: layout.measurements[field.id],
  }));
  if (layout.cornerRadius) {
    rows.push({
      key: "cornerRadius",
      label: "Corner radius",
      parsed: layout.cornerRadius,
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
        {rows.map(({ key, label, parsed }) => (
          <tr key={key}>
            <th scope="row">{label}</th>
            <td>
              {parsed.source.text} {lengthUnitSuffix(parsed.source.unit)}
            </td>
            <td data-field-mm={key}>
              {formatMillimetres(parsed.valueMm, "mm")} mm
            </td>
            {showsDisplayUnit && (
              <td>
                {formatMillimetres(parsed.valueMm, displayUnit)}{" "}
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
