import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectsPage from "./ProjectsPage";
import { createFakeProjectRepository } from "./testing/fakeProjectRepository";
import { createPendingWorkTracker } from "../pwa/pendingWork";
import { PendingWorkContext } from "../pwa/pendingWorkContext";
import type { ProjectRepository } from "./ProjectRepository";

afterEach(() => {
  cleanup();
});

/** Renders the page inside a shell that can demand durability, as AppShell does. */
function renderPageWithTracker(repository: ProjectRepository) {
  const tracker = createPendingWorkTracker();
  render(
    <PendingWorkContext value={tracker}>
      <ProjectsPage repository={repository} />
    </PendingWorkContext>,
  );
  return { tracker, user: userEvent.setup() };
}

async function createAndRenameWithoutSaving(
  user: ReturnType<typeof userEvent.setup>,
  created: string,
  typed: string,
) {
  await user.type(screen.getByLabelText("Project name"), created);
  await user.click(screen.getByRole("button", { name: "Create project" }));
  const renameInput = await screen.findByLabelText("Rename project");
  await user.clear(renameInput);
  await user.type(renameInput, typed);
  return renameInput;
}

describe("ProjectsPage durability", () => {
  it("makes an unsaved rename durable when the shell flushes", async () => {
    const saveDraft = vi.fn().mockResolvedValue(undefined);
    const repository = createFakeProjectRepository({ saveDraft });
    const { tracker, user } = renderPageWithTracker(repository);

    await createAndRenameWithoutSaving(user, "Pantry Jars", "Spice Jars");

    await tracker.flush();

    expect(saveDraft).toHaveBeenLastCalledWith(
      expect.any(String),
      "Spice Jars",
    );
  });

  it("reports the failure so the shell can refuse to discard the page", async () => {
    const saveDraft = vi
      .fn()
      .mockRejectedValue(new Error("The local database is unavailable."));
    const repository = createFakeProjectRepository({ saveDraft });
    const { tracker, user } = renderPageWithTracker(repository);

    const renameInput = await createAndRenameWithoutSaving(
      user,
      "Pantry Jars",
      "Spice Jars",
    );

    await expect(tracker.flush()).rejects.toThrow(
      "The local database is unavailable.",
    );
    // The page keeps running with the typed name intact.
    expect(renameInput).toHaveValue("Spice Jars");
  });

  it("has nothing to flush once the rename is saved", async () => {
    const repository = createFakeProjectRepository();
    const { tracker, user } = renderPageWithTracker(repository);

    await createAndRenameWithoutSaving(user, "Pantry Jars", "Spice Jars");
    await user.click(screen.getByRole("button", { name: "Save name" }));
    await screen.findByRole("heading", { name: "Editing Spice Jars" });

    await expect(tracker.flush()).resolves.toBeUndefined();
    expect(await repository.listDrafts()).toEqual([]);
  });

  it("stops contributing pending work once the page unmounts", async () => {
    const saveDraft = vi
      .fn()
      .mockRejectedValue(new Error("The local database is unavailable."));
    const repository = createFakeProjectRepository({ saveDraft });
    const { tracker, user } = renderPageWithTracker(repository);

    await createAndRenameWithoutSaving(user, "Pantry Jars", "Spice Jars");
    cleanup();

    await expect(tracker.flush()).resolves.toBeUndefined();
  });
});
