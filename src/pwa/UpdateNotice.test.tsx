import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpdateNotice from "./UpdateNotice";
import type { ServiceWorkerUpdateState } from "./serviceWorkerUpdate";

function renderNotice(state: ServiceWorkerUpdateState) {
  const onUpdate = vi.fn();
  const onDismiss = vi.fn();
  const view = render(
    <UpdateNotice state={state} onUpdate={onUpdate} onDismiss={onDismiss} />,
  );
  return { ...view, onUpdate, onDismiss };
}

describe("UpdateNotice", () => {
  it.each<ServiceWorkerUpdateState>([
    { status: "idle" },
    { status: "dismissed" },
  ])("offers nothing for $status", (state) => {
    renderNotice(state);

    expect(
      screen.queryByRole("button", { name: "Update now" }),
    ).not.toBeInTheDocument();
  });

  it("keeps a live region mounted so a later update is announced", () => {
    renderNotice({ status: "idle" });

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("announces a waiting update without relying on colour", async () => {
    const { onUpdate, onDismiss } = renderNotice({ status: "waiting" });

    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Update available:");
    expect(region).toHaveTextContent(/saves your open changes first/i);

    await userEvent.click(screen.getByRole("button", { name: "Update now" }));
    expect(onUpdate).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not take focus away from the current task", () => {
    render(
      <>
        <input aria-label="Rename project" autoFocus />
        <UpdateNotice
          state={{ status: "waiting" }}
          onUpdate={vi.fn()}
          onDismiss={vi.fn()}
        />
      </>,
    );

    expect(screen.getByLabelText("Rename project")).toHaveFocus();
  });

  it("states that saving is in progress and prevents a second request", () => {
    renderNotice({ status: "activating" });

    expect(screen.getByRole("status")).toHaveTextContent("Updating:");
    expect(screen.getByRole("button", { name: "Update now" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Later" })).toBeDisabled();
  });

  it("explains a blocked update and offers a retry", async () => {
    const { onUpdate } = renderNotice({
      status: "failed",
      reason: "The local database is unavailable.",
    });

    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Update blocked:");
    expect(region).toHaveTextContent("The local database is unavailable.");
    expect(region).toHaveTextContent(/nothing was lost/i);

    await userEvent.click(
      screen.getByRole("button", { name: "Try updating again" }),
    );
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});
