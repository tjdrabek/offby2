import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppShell from "./AppShell";
import { DESTINATIONS } from "./destinations";

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

describe("AppShell", () => {
  it("renders all five destination names in a named navigation landmark", () => {
    render(<AppShell />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const destination of DESTINATIONS) {
      expect(
        screen.getByRole("link", { name: destination.label }),
      ).toBeInTheDocument();
      expect(nav).toContainElement(
        screen.getByRole("link", { name: destination.label }),
      );
    }
  });

  it("lands on Projects by default with a matching heading and current marker", () => {
    render(<AppShell />);

    expect(
      screen.getByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("offers a skip link as the first stop in the tab order", async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.tab();

    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toHaveFocus();
  });

  it("moves focus into main content without changing the active destination", async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(
      screen.getByRole("link", { name: "Skip to main content" }),
    );

    expect(screen.getByRole("main")).toHaveFocus();
    // Destinations route on the hash, so the skip link must not navigate.
    expect(window.location.hash).toBe("");
    expect(
      screen.getByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
  });

  it("activates the matching destination and heading when navigation is used", async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole("link", { name: "Sheet layouts" }));

    expect(
      screen.getByRole("heading", { name: "Sheet layouts" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sheet layouts" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
