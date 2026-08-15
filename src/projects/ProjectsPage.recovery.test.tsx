import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectsPage from "./ProjectsPage";
import type { ProjectRepository } from "./ProjectRepository";
import { createFakeProjectRepository } from "./testing/fakeProjectRepository";

afterEach(() => {
  cleanup();
});

async function seedRecoverableDraft(repository: ProjectRepository) {
  const project = await repository.create("Pantry Jars");
  await repository.saveDraft(project.id, "Spice Jars");
  return project;
}

describe("ProjectsPage recovery", () => {
  it("names the project and reason, then restores the draft on recover", async () => {
    const user = userEvent.setup();
    const repository = createFakeProjectRepository();
    await seedRecoverableDraft(repository);

    render(<ProjectsPage repository={repository} />);

    expect(
      await screen.findByRole("heading", { name: "Recover unsaved changes?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '"Pantry Jars" has an unsaved rename to "Spice Jars" from a previous session.',
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: 'Recover "Spice Jars"' }),
    );

    const list = await screen.findByRole("list");
    expect(await within(list).findByRole("listitem")).toHaveTextContent(
      "Spice Jars",
    );
    expect(
      screen.queryByRole("heading", { name: "Recover unsaved changes?" }),
    ).not.toBeInTheDocument();
    await expect(repository.listDrafts()).resolves.toEqual([]);
  });

  it("moves focus to the recovery heading so the choice is reachable", async () => {
    const repository = createFakeProjectRepository();
    await seedRecoverableDraft(repository);

    render(<ProjectsPage repository={repository} />);

    const heading = await screen.findByRole("heading", {
      name: "Recover unsaved changes?",
    });
    expect(heading).toHaveFocus();
  });

  it("requires confirmation before discarding, and cancelling keeps the offer", async () => {
    const user = userEvent.setup();
    const repository = createFakeProjectRepository();
    await seedRecoverableDraft(repository);

    render(<ProjectsPage repository={repository} />);
    await screen.findByRole("heading", { name: "Recover unsaved changes?" });

    await user.click(screen.getByRole("button", { name: "Discard" }));
    const dialog = await screen.findByRole("alertdialog", {
      name: "Discard unsaved changes?",
    });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Recover unsaved changes?" }),
    ).toBeInTheDocument();
    await expect(repository.listDrafts()).resolves.toHaveLength(1);
  });

  it("removes only the draft on confirmed discard, keeping the saved project", async () => {
    const user = userEvent.setup();
    const repository = createFakeProjectRepository();
    await seedRecoverableDraft(repository);

    render(<ProjectsPage repository={repository} />);
    await screen.findByRole("heading", { name: "Recover unsaved changes?" });

    await user.click(screen.getByRole("button", { name: "Discard" }));
    const dialog = await screen.findByRole("alertdialog", {
      name: "Discard unsaved changes?",
    });
    await user.click(within(dialog).getByRole("button", { name: "Discard" }));

    expect(
      screen.queryByRole("heading", { name: "Recover unsaved changes?" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("list")).getByRole("listitem"),
    ).toHaveTextContent("Pantry Jars");
    await expect(repository.listDrafts()).resolves.toEqual([]);
  });

  it("explains unreadable recovery data and leaves the durable project intact", async () => {
    const repository = createFakeProjectRepository({
      listDrafts: async () => [{ projectId: "p0", schemaVersion: 999 }],
    });
    await repository.create("Pantry Jars");

    render(<ProjectsPage repository={repository} />);

    expect(
      await screen.findByRole("heading", {
        name: "Saved recovery data couldn't be read",
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list")).getByRole("listitem"),
    ).toHaveTextContent("Pantry Jars");
  });

  it("keeps the project and reports an error when recovery fails to save", async () => {
    const user = userEvent.setup();
    const repository = createFakeProjectRepository({
      rename: async () => {
        throw new Error("boom");
      },
    });
    await seedRecoverableDraft(repository);

    render(<ProjectsPage repository={repository} />);
    await screen.findByRole("heading", { name: "Recover unsaved changes?" });

    await user.click(
      screen.getByRole("button", { name: 'Recover "Spice Jars"' }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not recover the saved changes. Try again.",
    );
    expect(
      within(screen.getByRole("list")).getByRole("listitem"),
    ).toHaveTextContent("Pantry Jars");
    await expect(repository.listDrafts()).resolves.toHaveLength(1);
  });

  it("does not offer recovery when no draft was saved", async () => {
    const repository = createFakeProjectRepository();
    await repository.create("Pantry Jars");

    render(<ProjectsPage repository={repository} />);

    expect(
      await within(await screen.findByRole("list")).findByRole("listitem"),
    ).toHaveTextContent("Pantry Jars");
    expect(
      screen.queryByRole("heading", { name: "Recover unsaved changes?" }),
    ).not.toBeInTheDocument();
  });
});
