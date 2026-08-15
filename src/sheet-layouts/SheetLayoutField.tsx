import { useId } from "react";
import DerivedValueNotice from "./DerivedValueNotice";
import type { SheetLayoutDerivation } from "./deriveDimension";
import type { LengthUnit, SheetLayoutFieldId } from "./SheetLayoutInput";
import type { SheetLayoutIssue } from "./validateSheetLayoutInput";

interface SheetLayoutFieldProps {
  /** Identifies the control so the form can send focus to it after a refusal. */
  field: SheetLayoutFieldId;
  /** Full accessible name, including the unit for dimensional fields. */
  label: string;
  value: string;
  onChange: (text: string) => void;
  issue?: SheetLayoutIssue;
  /** Present when this field's value was calculated rather than typed. */
  derivation?: SheetLayoutDerivation;
  /** Unit the derivation is restated in, alongside its millimetres. */
  displayUnit?: LengthUnit;
}

/**
 * One labelled text entry. The source text is held verbatim — no parsing,
 * trimming, or coercion happens here — so an invalid entry stays on screen to
 * be corrected. Its problem, or the derivation that stands in for an entry it
 * never received, is associated programmatically rather than shown as colour
 * alone.
 */
function SheetLayoutField({
  field,
  label,
  value,
  onChange,
  issue,
  derivation,
  displayUnit = "mm",
}: SheetLayoutFieldProps) {
  const inputId = useId();
  const errorId = useId();
  const derivedId = useId();
  const describedBy = issue ? errorId : derivation ? derivedId : undefined;

  return (
    <div className="sheet-layout-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        data-field={field}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        aria-invalid={issue ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      {issue && (
        <p id={errorId} className="sheet-layout-field-error">
          {issue.message}
        </p>
      )}
      {!issue && derivation && (
        <DerivedValueNotice
          derivation={derivation}
          displayUnit={displayUnit}
          id={derivedId}
        />
      )}
    </div>
  );
}

export default SheetLayoutField;
