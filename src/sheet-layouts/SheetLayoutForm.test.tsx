import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SheetLayoutForm from "./SheetLayoutForm";
import { MAX_GRID_COUNT } from "./SheetGeometry";

afterEach(() => {
  cleanup();
});

/** Every dimensional field, in the unit the form is currently showing. */
const MEASUREMENTS: readonly [string, string][] = [
  ["Sheet width", "210"],
  ["Sheet height", "297"],
  ["Label width", "63.5"],
  ["Label height", "38.1"],
  ["Top margin", "10"],
  ["Right margin", "7"],
  ["Bottom margin", "10"],
  ["Left margin", "7"],
  ["Horizontal gap", "2.5"],
  ["Vertical gap", "0"],
];

async function fillCompleteSheet(
  user: ReturnType<typeof userEvent.setup>,
  suffix = "mm",
) {
  for (const [label, value] of MEASUREMENTS) {
    await user.type(screen.getByLabelText(`${label} (${suffix})`), value);
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
        marginTop: { text: "10", unit: "mm" },
        marginRight: { text: "7", unit: "mm" },
        marginBottom: { text: "10", unit: "mm" },
        marginLeft: { text: "7", unit: "mm" },
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
    await fillCompleteSheet(user, "in");
    await user.clear(screen.getByLabelText("Label width (in)"));
    await user.type(screen.getByLabelText("Label width (in)"), "2 1/2");
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
