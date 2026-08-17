import { screen } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

type User = ReturnType<typeof userEvent.setup>;

/**
 * Fills the sheet-layout form through its visible controls, addressing every
 * field by the accessible name a user would hear.
 *
 * Measurement labels carry their unit suffix, so `suffix` must match the unit
 * the form is currently showing.
 */
export async function fillSheetLayoutForm(
  user: User,
  values: readonly [string, string][],
  suffix: string,
  counts: { rows: string; columns: string },
) {
  for (const [label, value] of values) {
    const field = screen.getByLabelText(`${label} (${suffix})`);
    await user.clear(field);
    await user.type(field, value);
  }
  await user.clear(screen.getByLabelText("Rows"));
  await user.type(screen.getByLabelText("Rows"), counts.rows);
  await user.clear(screen.getByLabelText("Columns"));
  await user.type(screen.getByLabelText("Columns"), counts.columns);
}

/**
 * An A4 sheet of 21 labels whose axis equations balance exactly:
 * 210 = 10 + 3 × 60 + 2 × 5 + 10, and 297 = 9.5 + 7 × 38 + 6 × 2 + 9.5.
 */
export const CONSISTENT_SHEET_VALUES: readonly [string, string][] = [
  ["Sheet width", "210"],
  ["Sheet height", "297"],
  ["Label width", "60"],
  ["Label height", "38"],
  ["Top margin", "9.5"],
  ["Right margin", "10"],
  ["Bottom margin", "9.5"],
  ["Left margin", "10"],
  ["Horizontal gap", "5"],
  ["Vertical gap", "2"],
];

/** Fills {@link CONSISTENT_SHEET_VALUES} and checks it, leaving a resolved layout on screen. */
export async function checkConsistentSheet(
  user: User,
  overrides: readonly [string, string][] = [],
) {
  const values = CONSISTENT_SHEET_VALUES.map(
    ([label, value]) =>
      [label, overrides.find(([field]) => field === label)?.[1] ?? value] as [
        string,
        string,
      ],
  );
  await fillSheetLayoutForm(user, values, "mm", { rows: "7", columns: "3" });
  await user.click(screen.getByRole("button", { name: "Check measurements" }));
}
