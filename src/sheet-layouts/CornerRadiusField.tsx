import { useId } from "react";
import SheetLayoutField from "./SheetLayoutField";
import {
  CORNER_RADIUS_STATES,
  cornerRadiusValue,
  lengthUnitSuffix,
  type CornerRadiusInput,
  type CornerRadiusStateId,
} from "./SheetLayoutInput";
import type { SheetLayoutIssue } from "./validateSheetLayoutInput";

interface CornerRadiusFieldProps {
  value: CornerRadiusInput;
  onStateChange: (state: CornerRadiusStateId) => void;
  onValueChange: (text: string) => void;
  issue?: SheetLayoutIssue;
}

/**
 * The four-state corner-radius disclosure. Each state is a separate choice
 * with its own written description, so "unknown" can never be mistaken for
 * "zero", and the radius measurement only exists for the two states that
 * actually claim one.
 */
function CornerRadiusField({
  value,
  onStateChange,
  onValueChange,
  issue,
}: CornerRadiusFieldProps) {
  const groupName = useId();
  const radius = cornerRadiusValue(value);

  return (
    <fieldset className="sheet-layout-fieldset">
      <legend>Corner radius</legend>
      {CORNER_RADIUS_STATES.map((option) => {
        const optionId = `${groupName}-${option.state}`;
        const descriptionId = `${optionId}-description`;
        return (
          <div className="sheet-layout-choice" key={option.state}>
            <input
              type="radio"
              id={optionId}
              name={groupName}
              value={option.state}
              checked={value.state === option.state}
              aria-describedby={descriptionId}
              onChange={() => onStateChange(option.state)}
            />
            <label htmlFor={optionId}>{option.label}</label>
            <p id={descriptionId} className="sheet-layout-choice-description">
              {option.description}
            </p>
          </div>
        );
      })}
      {radius && (
        <SheetLayoutField
          field="cornerRadius"
          label={`Corner radius (${lengthUnitSuffix(radius.unit)})`}
          value={radius.text}
          onChange={onValueChange}
          issue={issue}
        />
      )}
    </fieldset>
  );
}

export default CornerRadiusField;
