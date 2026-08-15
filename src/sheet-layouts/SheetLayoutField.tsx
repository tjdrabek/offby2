import { useId } from "react";
import type { SheetLayoutFieldId } from "./SheetLayoutInput";
import type { SheetLayoutIssue } from "./validateSheetLayoutInput";

interface SheetLayoutFieldProps {
  /** Identifies the control so the form can send focus to it after a refusal. */
  field: SheetLayoutFieldId;
  /** Full accessible name, including the unit for dimensional fields. */
  label: string;
  value: string;
  onChange: (text: string) => void;
  issue?: SheetLayoutIssue;
}

/**
 * One labelled text entry. The source text is held verbatim — no parsing,
 * trimming, or coercion happens here — so an invalid entry stays on screen to
 * be corrected. Its problem is associated programmatically rather than being
 * shown as colour alone.
 */
function SheetLayoutField({
  field,
  label,
  value,
  onChange,
  issue,
}: SheetLayoutFieldProps) {
  const inputId = useId();
  const errorId = useId();

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
        aria-describedby={issue ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {issue && (
        <p id={errorId} className="sheet-layout-field-error">
          {issue.message}
        </p>
      )}
    </div>
  );
}

export default SheetLayoutField;
