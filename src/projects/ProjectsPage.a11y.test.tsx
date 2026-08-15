import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectsPage from "./ProjectsPage";
import type { ProjectRepository } from "./ProjectRepository";
import { createFakeProjectRepository } from "./testing/fakeProjectRepository";

afterEach(() => {
  cleanup();
});

function statusRegion() {
  return screen.getByRole("status", { name: "Project status" });
}

/** Creates a project without touching the mouse, as a keyboard user would. */
async function createByKeyboard(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  screen.getByLabelText("Project name").focus();
  await user.keyboard(`${name}{Enter}`);
  return screen.findByRole("button", { name: `Delete ${name}` });
}

describe("ProjectsPage keyboard operability", () => {
  it("starts with an empty status region so later messages are announced", () => {
    render(<ProjectsPage repository={createFakeProjectRepository()} />);

    expect(statusRegion()).toBeEmptyDOMElement();
  });

  it("reaches the create field first and creates a project with the keyboard", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage repository={createFakeProjectRepository()} />);

    await user.tab();
    expect(screen.getByLabelText("Project name")).toHaveFocus();

    await user.keyboard("Pantry Jars{Enter}");

    expect(
      await screen.findByRole("button", { name: "Delete Pantry Jars" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(statusRegion()).toHaveTextContent(
        'Project "Pantry Jars" created and opened for editing.',
      );
    });
  });

  it("announces a rename made with the keyboard", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage repository={createFakeProjectRepository()} />);

    await createByKeyboard(user, "Pantry Jars");
    const renameInput = await screen.findByLabelText("Rename project");
    renameInput.focus();
    await user.keyboard("{Control>}a{/Control}Spice Jars{Enter}");

    await waitFor(() => {
      expect(statusRegion()).toHaveTextContent(
        'Project renamed to "Spice Jars".',
      );
    });
  });

  it("associates an empty-name refusal with the field it came from", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage repository={createFakeProjectRepository()} />);

    await user.click(screen.getByRole("button", { name: "Create project" }));

    const input = screen.getByLabelText("Project name");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Enter a project name before creating a project.",
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a project name before creating a project.",
    );
  });

  it("opens delete confirmation with Enter, traps focus, and restores it on Escape", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage repository={createFakeProjectRepository()} />);

    const deleteButton = await createByKeyboard(user, "Pantry Jars");
    deleteButton.focus();
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("alertdialog", {
      name: "Delete project?",
    });
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    expect(cancel).toHaveFocus();

    await user.tab();
    expect(
      within(dialog).getByRole("button", { name: "Delete" }),
    ).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(deleteButton).toHaveFocus();
    });
    expect(
      within(screen.getByRole("list")).getByRole("listitem"),
    ).toHaveTextContent("Pantry Jars");
  });

  it("announces deletion and parks focus on the next action once the row is gone", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage repository={createFakeProjectRepository()} />);

    const deleteButton = await createByKeyboard(user, "Pantry Jars");
    await user.click(deleteButton);
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(statusRegion()).toHaveTextContent(
        'Project "Pantry Jars" deleted.',
      );
    });
    expect(screen.getByLabelText("Project name")).toHaveFocus();
  });
});

describe("ProjectsPage recovery keyboard operability", () => {
  async function seedRecoverableDraft(repository: ProjectRepository) {
    const project = await repository.create("Pantry Jars");
    await repository.saveDraft(project.id, "Spice Jars");
    return project;
  }

  it("announces a recovered draft", async () => {
    const user = userEvent.setup();
    const repository = createFakeProjectRepository();
    await seedRecoverableDraft(repository);
    render(<ProjectsPage repository={repository} />);

    await user.click(
      await screen.findByRole("button", { name: 'Recover "Spice Jars"' }),
    );

    await waitFor(() => {
      expect(statusRegion()).toHaveTextContent(
        'Unsaved changes recovered. Project renamed to "Spice Jars".',
      );
    });
  });

  it("keeps focus on the page after the discard dialog removes its own banner", async () => {
    const user = userEvent.setup();
    const repository = createFakeProjectRepository();
    await seedRecoverableDraft(repository);
    render(<ProjectsPage repository={repository} />);

    await user.click(await screen.findByRole("button", { name: "Discard" }));
    const dialog = await screen.findByRole("alertdialog", {
      name: "Discard unsaved changes?",
    });
    await user.click(within(dialog).getByRole("button", { name: "Discard" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Recover unsaved changes?" }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("Project name")).toHaveFocus();
    expect(statusRegion()).toHaveTextContent(
      "Unsaved changes discarded. Your saved project is unchanged.",
    );
  });
});
