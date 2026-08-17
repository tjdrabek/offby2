import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SheetLayoutsPage from "./SheetLayoutsPage";
import { createFakeSheetLayoutRepository } from "./testing/fakeSheetLayoutRepository";
import { checkConsistentSheet } from "./testing/sheetLayoutFormActions";
import type { SheetLayoutRepository } from "./SheetLayoutRepository";
import { resolvedSheetLayout } from "./testing/sheetLayoutFixtures";

afterEach(() => {
  cleanup();
});

function renderPage(repository: SheetLayoutRepository) {
  render(<SheetLayoutsPage repository={repository} />);
  return userEvent.setup();
}

function saveStatus() {
  return screen.getByRole("status", { name: "Sheet layout save status" });
}

describe("SheetLayoutsPage", () => {
  it("offers nothing to save until the measurements are checked", async () => {
    renderPage(createFakeSheetLayoutRepository());

    expect(
      screen.queryByRole("button", { name: "Save as a new sheet layout" }),
    ).toBeNull();
    expect(
      await screen.findByText(/No sheet layouts saved yet/),
    ).toBeInTheDocument();
  });

  it("creates a layout identity and revision 1 from checked measurements", async () => {
    const user = renderPage(createFakeSheetLayoutRepository());

    await checkConsistentSheet(user);
    await user.type(screen.getByLabelText("Sheet layout name"), "Avery L7160");
    await user.click(
      screen.getByRole("button", { name: "Save as a new sheet layout" }),
    );

    expect(saveStatus()).toHaveTextContent(
      'Sheet layout "Avery L7160" saved as revision 1.',
    );
    const list = screen.getByRole("list", { name: "Saved sheet layouts" });
    expect(within(list).getByText(/Avery L7160 — 1 revision/)).toBeVisible();
    expect(
      screen.getByRole("rowheader", { name: "Revision 1" }),
    ).toBeInTheDocument();
  });

  it("refuses to save a layout with no name", async () => {
    const user = renderPage(createFakeSheetLayoutRepository());

    await checkConsistentSheet(user);
    await user.click(
      screen.getByRole("button", { name: "Save as a new sheet layout" }),
    );

    expect(
      screen.getByText("Enter a name for this sheet layout."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Sheet layout name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("appends a revision to the open layout and leaves the first one readable", async () => {
    const user = renderPage(createFakeSheetLayoutRepository());

    await checkConsistentSheet(user);
    await user.type(screen.getByLabelText("Sheet layout name"), "Avery L7160");
    await user.click(
      screen.getByRole("button", { name: "Save as a new sheet layout" }),
    );

    // 210 = 10 + 3 × 59 + 2 × 6.5 + 10.
    await checkConsistentSheet(user, [
      ["Label width", "59"],
      ["Horizontal gap", "6.5"],
    ]);
    await user.click(
      screen.getByRole("button", {
        name: "Save as revision 2 of Avery L7160",
      }),
    );

    expect(saveStatus()).toHaveTextContent(
      'Revision 2 of "Avery L7160" saved. Earlier revisions are unchanged.',
    );
    const revisions = screen.getByRole("table", {
      name: "Revisions of Avery L7160",
    });
    const rows = within(revisions).getAllByRole("row");
    expect(
      within(rows[1]).getByRole("rowheader", { name: "Revision 1" }),
    ).toBeInTheDocument();
    // The label the first revision was saved with, beside the correction.
    expect(within(rows[1]).getByText("60 × 38")).toBeInTheDocument();
    expect(within(rows[2]).getByText("59 × 38")).toBeInTheDocument();
    expect(screen.getByText(/Avery L7160 — 2 revisions/)).toBeInTheDocument();
  });

  it("keeps the save controls out of reach while the geometry is refused", async () => {
    const user = renderPage(createFakeSheetLayoutRepository());

    // A sheet 20 mm wider than its parts describe cannot be saved at all.
    await checkConsistentSheet(user, [["Sheet width", "230"]]);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /cannot be described as entered/,
    );
    expect(
      screen.queryByRole("button", { name: "Save as a new sheet layout" }),
    ).toBeNull();
  });

  it("reports a save failure without claiming anything was stored", async () => {
    const user = renderPage(
      createFakeSheetLayoutRepository({
        createLayout: () => Promise.reject(new Error("disk full")),
      }),
    );

    await checkConsistentSheet(user);
    await user.type(screen.getByLabelText("Sheet layout name"), "Avery L7160");
    await user.click(
      screen.getByRole("button", { name: "Save as a new sheet layout" }),
    );

    expect(
      await screen.findByText("Could not save the sheet layout. Try again."),
    ).toBeInTheDocument();
    expect(saveStatus()).toBeEmptyDOMElement();
    expect(screen.getByText(/No sheet layouts saved yet/)).toBeInTheDocument();
  });

  it("lists layouts saved in an earlier session and opens their revisions", async () => {
    const repository = createFakeSheetLayoutRepository();
    const created = await repository.createLayout(
      "Avery L7160",
      resolvedSheetLayout(),
    );
    await repository.appendRevision(
      created.layout.id,
      resolvedSheetLayout({ labelWidth: "59", horizontalGap: "6.5" }),
    );
    const user = renderPage(repository);

    await user.click(
      await screen.findByRole("button", { name: "Open Avery L7160" }),
    );

    expect(
      await screen.findByRole("rowheader", { name: "Revision 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Currently open: Avery L7160" }),
    ).toBeInTheDocument();
  });
});
