import { formatMeasurement } from "./measurementUnits";
import type { SheetLayoutDerivation } from "./deriveDimension";
import type { LengthUnit } from "./SheetLayoutInput";

interface DerivedValueNoticeProps {
  derivation: SheetLayoutDerivation;
  /** Presentation only: the millimetre value is the one that was derived. */
  displayUnit: LengthUnit;
  /** Lets the affected input describe itself with this disclosure. */
  id?: string;
}

/**
 * States that one value was calculated rather than typed, and shows the work.
 *
 * The field's own entry is left exactly as the user left it — empty — so this
 * discloses the derivation beside the input instead of filling it in. The
 * equation and its substituted form are both shown so the arithmetic can be
 * checked, and "Derived value" is written in text rather than signalled by the
 * panel's colour alone.
 */
function DerivedValueNotice({
  derivation,
  displayUnit,
  id,
}: DerivedValueNoticeProps) {
  const millimetres = formatMeasurement(derivation.valueMm, "mm");
  const inDisplayUnit =
    displayUnit === "mm"
      ? null
      : formatMeasurement(derivation.valueMm, displayUnit);

  return (
    <div
      className="sheet-layout-derived"
      id={id}
      data-derived-field={derivation.field}
    >
      <p className="sheet-layout-derived-headline">
        Derived value: {derivation.label} is {millimetres}
        {inDisplayUnit ? ` (${inDisplayUnit})` : ""}. It was calculated from the
        other {derivation.axis} measurements, not entered.
      </p>
      <p className="sheet-layout-derived-equation">{derivation.equation}</p>
      <p className="sheet-layout-derived-equation">
        {derivation.substitution} (mm)
      </p>
    </div>
  );
}

export default DerivedValueNotice;
