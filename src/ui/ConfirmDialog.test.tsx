import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "./ConfirmDialog";

afterEach(() => {
  cleanup();
});

interface HarnessProps {
  pending?: boolean;
  /** Mimics confirming an action that removes the control that opened it. */
  removeTriggerOnConfirm?: boolean;
  onCancel?: () => void;
}

function DialogHarness({
  pending = false,
  removeTriggerOnConfirm = false,
  onCancel,
}: HarnessProps) {
  const [open, setOpen] = useState(false);
  const [triggerVisible, setTriggerVisible] = useState(true);
  const fallbackRef = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button type="button" ref={fallbackRef}>
        Fallback target
      </button>
      {triggerVisible && (
        <button type="button" onClick={() => setOpen(true)}>
          Open dialog
        </button>
      )}
      <button type="button">Outside after</button>
      {open && (
        <ConfirmDialog
          title="Delete project?"
          description='Delete "Pantry Jars"? This cannot be undone.'
          confirmLabel="Delete"
          destructive
          pending={pending}
          onCancel={() => {
            onCancel?.();
            setOpen(false);
          }}
          onConfirm={() => {
            if (removeTriggerOnConfirm) {
              setTriggerVisible(false);
            }
            setOpen(false);
          }}
          restoreFocusFallback={() => fallbackRef.current}
        />
      )}
    </div>
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Open dialog" }));
  return screen.getByRole("alertdialog", { name: "Delete project?" });
}

describe("ConfirmDialog", () => {
  it("names and describes itself from its own content", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const dialog = await openDialog(user);

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Delete project?");
    expect(dialog).toHaveAccessibleDescription(
      'Delete "Pantry Jars"? This cannot be undone.',
    );
  });

  it("moves focus to the non-destructive choice when it opens", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const dialog = await openDialog(user);

    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toHaveFocus();
  });

  it("keeps Tab and Shift+Tab inside the dialog", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const dialog = await openDialog(user);
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    const confirm = within(dialog).getByRole("button", { name: "Delete" });

    await user.tab();
    expect(confirm).toHaveFocus();
    // Past the last control, focus wraps rather than escaping to the page.
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });

  it("cancels on Escape", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<DialogHarness onCancel={onCancel} />);

    await openDialog(user);
    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("ignores Escape while the confirmed action is still running", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<DialogHarness pending onCancel={onCancel} />);

    await openDialog(user);
    await user.keyboard("{Escape}");

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("restores focus to the control that opened it", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Open dialog" })).toHaveFocus();
    });
  });

  it("falls back to a named target when the opener no longer exists", async () => {
    const user = userEvent.setup();
    render(<DialogHarness removeTriggerOnConfirm />);

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      screen.queryByRole("button", { name: "Open dialog" }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Fallback target" }),
      ).toHaveFocus();
    });
  });
});
