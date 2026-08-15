import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SheetLayoutForm from "./SheetLayoutForm";
import { MAX_GRID_COUNT } from "./SheetGeometry";

afterEach(() => {
  cleanup();
});

/**
 * Every dimensional field of an A4 sheet of 21 labels, in millimetres.
 *
 * Both axis equations balance, which is what the geometry validator requires:
 * 210 = 7.25 + 3 × 63.5 + 2 × 2.5 + 7.25, and 297 = 15.15 + 7 × 38.1 + 15.15.
 */
const MEASUREMENTS: readonly [string, string][] = [
  ["Sheet width", "210"],
  ["Sheet height", "297"],
  ["Label width", "63.5"],
  ["Label height", "38.1"],
  ["Top margin", "15.15"],
  ["Right margin", "7.25"],
  ["Bottom margin", "15.15"],
  ["Left margin", "7.25"],
  ["Horizontal gap", "2.5"],
  ["Vertical gap", "0"],
];

/**
 * The same sheet expressed in inches: US Letter carrying 18 labels.
 *
 * 8.5 = 0.25 + 3 × 2.5 + 2 × 0.25 + 0.25, and 11 = 0.5 + 6 × 1.5 + 5 × 0.2 + 0.5.
 * The label width is written as a fraction so it exercises that notation.
 */
const INCHES: readonly [string, string][] = [
  ["Sheet width", "8.5"],
  ["Sheet height", "11"],
  ["Label width", "2 1/2"],
  ["Label height", "1.5"],
  ["Top margin", "0.5"],
  ["Right margin", "0.25"],
  ["Bottom margin", "0.5"],
  ["Left margin", "0.25"],
  ["Horizontal gap", "0.25"],
  ["Vertical gap", "0.2"],
];

async function fillSheet(
  user: ReturnType<typeof userEvent.setup>,
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

async function fillCompleteSheet(user: ReturnType<typeof userEvent.setup>) {
  await fillSheet(user, MEASUREMENTS, "mm", { rows: "7", columns: "3" });
}

async function fillInchSheet(user: ReturnType<typeof userEvent.setup>) {
  await fillSheet(user, INCHES, "in", { rows: "6", columns: "3" });
}

/**
 * A sheet whose entries satisfy both axis equations exactly, so clearing any
 * one field leaves a single well-determined unknown.
 *
 * Horizontal: 210 = 10 + 3 × 60 + 2 × 5 + 10
 * Vertical:   297 = 9.5 + 7 × 38 + 6 × 2 + 9.5
 */
const CONSISTENT: readonly [string, string][] = [
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

async function fillConsistentSheet(user: ReturnType<typeof userEvent.setup>) {
  for (const [label, value] of CONSISTENT) {
    await user.type(screen.getByLabelText(`${label} (mm)`), value);
  }
  await user.type(screen.getByLabelText("Rows"), "7");
  await user.type(screen.getByLabelText("Columns"), "3");
}

function statusRegion() {
  return screen.getByRole("status", { name: "Sheet layout status" });
}

describe("SheetLayoutForm", () => {
  it("exposes every dimension, count, and gap with its unit in the label", () => {
    render(<SheetLayoutForm />);

    for (const [label] of MEASUREMENTS) {
      expect(screen.getByLabelText(`${label} (mm)`)).toBeInTheDocument();
    }
    expect(screen.getByLabelText("Rows")).toBeInTheDocument();
    expect(screen.getByLabelText("Columns")).toBeInTheDocument();
  });

  it("groups the dimensions under named fieldsets", () => {
    render(<SheetLayoutForm />);

    for (const legend of [
      "Sheet",
      "Label grid",
      "Margins",
      "Gaps between labels",
      "Corner radius",
    ]) {
      expect(screen.getByRole("group", { name: legend })).toBeInTheDocument();
    }
  });

  it("offers the four corner-radius states, with zero and unknown described apart", () => {
    render(<SheetLayoutForm />);

    const group = screen.getByRole("group", { name: "Corner radius" });
    const zero = within(group).getByRole("radio", {
      name: "Square corners (radius is zero)",
    });
    const unknown = within(group).getByRole("radio", {
      name: "Unknown radius",
    });

    expect(zero).toBeChecked();
    expect(unknown).not.toBeChecked();
    expect(
      within(group).getByRole("radio", { name: "Known radius" }),
    ).toBeInTheDocument();
    expect(
      within(group).getByRole("radio", { name: "Estimated radius" }),
    ).toBeInTheDocument();
    expect(
      within(group).getByText(/not the same as square corners/i),
    ).toBeInTheDocument();
  });

  it("shows a radius measurement only for the states that claim one", async () => {
    const user = userEvent.setup();
    render(<SheetLayoutForm />);

    expect(screen.queryByLabelText("Corner radius (mm)")).toBeNull();

    await user.click(screen.getByRole("radio", { name: "Known radius" }));
    await user.type(screen.getByLabelText("Corner radius (mm)"), "2");

    // The value follows the user across to the other measuring state.
    await user.click(screen.getByRole("radio", { name: "Estimated radius" }));
    expect(screen.getByLabelText("Corner radius (mm)")).toHaveValue("2");

    await user.click(screen.getByRole("radio", { name: "Unknown radius" }));
    expect(screen.queryByLabelText("Corner radius (mm)")).toBeNull();
  });

  it("restates every field in the chosen unit without losing what was typed", async () => {
    const user = userEvent.setup();
    render(<SheetLayoutForm />);

    await user.type(screen.getByLabelText("Sheet width (mm)"), "8 1/2");
    await user.selectOptions(
      screen.getByLabelText("Measurement unit"),
      "Inches (in)",
    );

    expect(screen.getByLabelText("Sheet width (in)")).toHaveValue("8 1/2");
    expect(screen.queryByLabelText("Sheet width (mm)")).toBeNull();
    expect(screen.getByLabelText("Left margin (in)")).toBeInTheDocument();
  });

  it("reports every missing entry against its own field and focuses the first", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "12 measurements still need attention",
    );
    const sheetWidth = screen.getByLabelText("Sheet width (mm)");
    expect(sheetWidth).toHaveFocus();
    expect(sheetWidth).toHaveAccessibleDescription("Enter a value.");
    expect(screen.getByLabelText("Rows")).toHaveAccessibleDescription(
      "Enter a value.",
    );
  });

  it("keeps an unusable count on screen instead of correcting it", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await fillCompleteSheet(user);
    await user.clear(screen.getByLabelText("Rows"));
    await user.type(screen.getByLabelText("Rows"), "2.5");
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    const rows = screen.getByLabelText("Rows");
    expect(rows).toHaveValue("2.5");
    expect(rows).toHaveFocus();
    expect(rows).toHaveAccessibleDescription("Rows must be a whole number.");
  });

  it("refuses a count outside the supported range", async () => {
    const user = userEvent.setup();
    render(<SheetLayoutForm />);

    await fillCompleteSheet(user);
    await user.clear(screen.getByLabelText("Columns"));
    await user.type(screen.getByLabelText("Columns"), `${MAX_GRID_COUNT + 1}`);
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(screen.getByLabelText("Columns")).toHaveAccessibleDescription(
      `Columns must be between 1 and ${MAX_GRID_COUNT}.`,
    );
  });

  it("refuses a claimed radius with no measurement behind it", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await fillCompleteSheet(user);
    await user.click(screen.getByRole("radio", { name: "Known radius" }));
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText("Corner radius (mm)"),
    ).toHaveAccessibleDescription("Enter a value.");
  });

  it("accepts a complete uniform grid and reports it as entered", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await fillCompleteSheet(user);
    await user.click(screen.getByRole("radio", { name: "Unknown radius" }));
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(statusRegion()).toHaveTextContent(
      "Measurements captured: 7 rows by 3 columns. Corner radius: Unknown radius.",
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({
      measurements: {
        sheetWidth: { text: "210", unit: "mm" },
        sheetHeight: { text: "297", unit: "mm" },
        labelWidth: { text: "63.5", unit: "mm" },
        labelHeight: { text: "38.1", unit: "mm" },
        marginTop: { text: "15.15", unit: "mm" },
        marginRight: { text: "7.25", unit: "mm" },
        marginBottom: { text: "15.15", unit: "mm" },
        marginLeft: { text: "7.25", unit: "mm" },
        horizontalGap: { text: "2.5", unit: "mm" },
        verticalGap: { text: "0", unit: "mm" },
      },
      counts: { rows: { text: "7" }, columns: { text: "3" } },
      cornerRadius: { state: "unknown" },
    });
  });

  it("shows what every entry normalized to, beside what was typed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await fillCompleteSheet(user);
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    const normalized = screen.getByRole("table", {
      name: "Normalized measurements",
    });
    const labelWidth = within(normalized).getByRole("row", {
      name: /Label width/,
    });
    expect(labelWidth).toHaveTextContent("63.5 mm");
    expect(onSubmit.mock.calls[0][1].measurements.labelWidth.valueMm).toBe(
      63.5,
    );
  });

  it("accepts an imperial fraction and normalizes it to millimetres", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await user.selectOptions(
      screen.getByLabelText("Measurement unit"),
      "Inches (in)",
    );
    await fillInchSheet(user);
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][1].measurements.labelWidth).toEqual({
      status: "parsed",
      valueMm: 63.5,
      source: { text: "2 1/2", unit: "in", notation: "fraction" },
    });
    expect(
      within(
        screen.getByRole("table", { name: "Normalized measurements" }),
      ).getByRole("row", { name: /Label width/ }),
    ).toHaveTextContent("2 1/2 in");
  });

  it("refuses text that is not a measurement and keeps it on screen", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await fillCompleteSheet(user);
    await user.clear(screen.getByLabelText("Label height (mm)"));
    await user.type(screen.getByLabelText("Label height (mm)"), "1 1/2");
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    const field = screen.getByLabelText("Label height (mm)");
    expect(field).toHaveValue("1 1/2");
    expect(field).toHaveFocus();
    expect(field).toHaveAccessibleDescription(
      /Fractions are only accepted for inches/,
    );
    expect(
      screen.queryByRole("table", { name: "Normalized measurements" }),
    ).toBeNull();
  });

  it("does not change a captured value when the display unit changes", async () => {
    const user = userEvent.setup();
    render(<SheetLayoutForm />);

    await fillCompleteSheet(user);
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    const millimetreCell = () =>
      screen
        .getByRole("table", { name: "Normalized measurements" })
        .querySelector('[data-field-mm="sheetWidth"]');
    expect(millimetreCell()).toHaveTextContent("210 mm");

    await user.selectOptions(
      screen.getByLabelText("Measurement unit"),
      "Inches (in)",
    );

    // The entry fields are restated in inches; the captured geometry is not.
    expect(screen.getByLabelText("Sheet width (in)")).toHaveValue("210");
    expect(millimetreCell()).toHaveTextContent("210 mm");
    expect(
      screen.getByRole("columnheader", { name: "Shown in in" }),
    ).toBeInTheDocument();
  });

  it("derives the one missing dimension and discloses it beside the field", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    // 210 = 10 + 3 × 60 + 2 × 5 + 10, with the left margin left empty.
    await fillConsistentSheet(user);
    await user.clear(screen.getByLabelText("Left margin (mm)"));
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    const marginLeft = screen.getByLabelText("Left margin (mm)");
    // The entry is not filled in for the user; the derivation stands beside it.
    expect(marginLeft).toHaveValue("");
    expect(marginLeft).not.toHaveAttribute("aria-invalid");
    expect(marginLeft).toHaveAccessibleDescription(
      /Derived value: Left margin is 10 mm/,
    );
    expect(marginLeft).toHaveAccessibleDescription(
      /210 = 10 \+ 3 × 60 \+ 2 × 5 \+ 10/,
    );
    expect(statusRegion()).toHaveTextContent(
      "Left margin was derived as 10 mm, not entered.",
    );
    expect(onSubmit.mock.calls[0][1].measurements.marginLeft).toMatchObject({
      status: "derived",
      valueMm: 10,
    });
  });

  it("marks a derived value apart from entered ones in the results", async () => {
    const user = userEvent.setup();
    render(<SheetLayoutForm />);

    await fillConsistentSheet(user);
    await user.clear(screen.getByLabelText("Horizontal gap (mm)"));
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    const table = screen.getByRole("table", {
      name: "Normalized measurements",
    });
    expect(
      within(table).getByRole("row", { name: /Horizontal gap/ }),
    ).toHaveTextContent("Derived, not entered");
    expect(
      within(table).getByRole("row", { name: /Right margin/ }),
    ).toHaveTextContent("10 mm");
  });

  it("refuses to derive a gap that a single column removes from the equation", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await fillConsistentSheet(user);
    await user.clear(screen.getByLabelText("Columns"));
    await user.type(screen.getByLabelText("Columns"), "1");
    await user.clear(screen.getByLabelText("Sheet width (mm)"));
    await user.type(screen.getByLabelText("Sheet width (mm)"), "80");
    await user.clear(screen.getByLabelText("Horizontal gap (mm)"));
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    const gap = screen.getByLabelText("Horizontal gap (mm)");
    expect(gap).toHaveFocus();
    expect(gap).toHaveAccessibleDescription(/cannot be derived/);
    expect(screen.queryByText(/Derived value:/)).toBeNull();
  });

  it("leaves two missing dimensions to be entered rather than guessed", async () => {
    const user = userEvent.setup();
    render(<SheetLayoutForm />);

    await fillConsistentSheet(user);
    await user.clear(screen.getByLabelText("Left margin (mm)"));
    await user.clear(screen.getByLabelText("Right margin (mm)"));
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "2 measurements still need attention",
    );
    expect(
      screen.getByLabelText("Left margin (mm)"),
    ).toHaveAccessibleDescription("Enter a value.");
    expect(screen.queryByText(/Derived value:/)).toBeNull();
  });

  it("refuses a sheet the measurements cannot describe, and keeps them", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await fillCompleteSheet(user);
    await user.clear(screen.getByLabelText("Right margin (mm)"));
    await user.type(screen.getByLabelText("Right margin (mm)"), "20");
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "This sheet cannot be described as entered",
    );
    expect(alert).toHaveTextContent(/add up to 222.75 mm/);
    // Nothing is corrected to make it fit, and no result is shown.
    expect(screen.getByLabelText("Right margin (mm)")).toHaveValue("20");
    expect(screen.getByLabelText("Sheet width (mm)")).toHaveValue("210");
    expect(
      screen.queryByRole("table", { name: "Normalized measurements" }),
    ).toBeNull();
  });

  it("associates a refusal with every field a reader could change", async () => {
    const user = userEvent.setup();
    render(<SheetLayoutForm />);

    await fillCompleteSheet(user);
    await user.clear(screen.getByLabelText("Right margin (mm)"));
    await user.type(screen.getByLabelText("Right margin (mm)"), "20");
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    const sheetWidth = screen.getByLabelText("Sheet width (mm)");
    expect(sheetWidth).toHaveFocus();
    for (const label of [
      "Sheet width (mm)",
      "Left margin (mm)",
      "Label width (mm)",
      "Horizontal gap (mm)",
      "Right margin (mm)",
      "Columns",
    ]) {
      expect(screen.getByLabelText(label)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByLabelText(label)).toHaveAccessibleDescription(
        /horizontal measurements add up to/,
      );
    }
    // The vertical axis still balances, so nothing there is marked.
    expect(screen.getByLabelText("Sheet height (mm)")).not.toHaveAttribute(
      "aria-invalid",
    );
  });

  it("lists every refused condition separately", async () => {
    const user = userEvent.setup();
    render(<SheetLayoutForm />);

    await fillCompleteSheet(user);
    await user.clear(screen.getByLabelText("Right margin (mm)"));
    await user.type(screen.getByLabelText("Right margin (mm)"), "20");
    await user.clear(screen.getByLabelText("Bottom margin (mm)"));
    await user.type(screen.getByLabelText("Bottom margin (mm)"), "5");
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    const problems = within(screen.getByRole("alert")).getAllByRole("listitem");
    expect(problems).toHaveLength(2);
    expect(problems[0]).toHaveTextContent(/horizontal measurements/);
    expect(problems[1]).toHaveTextContent(/vertical measurements/);
  });

  it("refuses a corner radius larger than half the shorter label side", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await fillCompleteSheet(user);
    await user.click(screen.getByRole("radio", { name: "Known radius" }));
    await user.type(screen.getByLabelText("Corner radius (mm)"), "25");
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    const radius = screen.getByLabelText("Corner radius (mm)");
    expect(radius).toHaveValue("25");
    expect(radius).toHaveAccessibleDescription(/19.05 mm or less/);
    expect(radius).toHaveFocus();
  });

  it("clears a refusal once the geometry is corrected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetLayoutForm onSubmit={onSubmit} />);

    await fillCompleteSheet(user);
    await user.clear(screen.getByLabelText("Horizontal gap (mm)"));
    await user.type(screen.getByLabelText("Horizontal gap (mm)"), "-2");
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/cannot overlap/);

    await user.clear(screen.getByLabelText("Horizontal gap (mm)"));
    await user.type(screen.getByLabelText("Horizontal gap (mm)"), "2.5");
    await user.click(
      screen.getByRole("button", { name: "Check measurements" }),
    );

    expect(screen.queryByRole("alert")).toBeNull();
    expect(statusRegion()).toHaveTextContent("Measurements captured");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("starts with an empty status region so a later result is announced", () => {
    render(<SheetLayoutForm />);

    expect(statusRegion()).toBeEmptyDOMElement();
  });

  it("offers no unsupported media, and says so in text", () => {
    render(<SheetLayoutForm />);

    const unitOptions = within(
      screen.getByLabelText("Measurement unit"),
    ).getAllByRole("option");
    expect(unitOptions.map((option) => option.textContent)).toEqual([
      "Millimetres (mm)",
      "Centimetres (cm)",
      "Inches (in)",
    ]);
    // The only selectable choices on the form are units and radius states.
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(
      screen.getByText(/circular, oval, roll, continuous/i),
    ).toBeInTheDocument();
  });
});
