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
import type { LabelProject } from "./LabelProject";
import type { ProjectRepository } from "./ProjectRepository";

afterEach(() => {
  cleanup();
});

function createFakeRepository(
  overrides: Partial<ProjectRepository> = {},
): ProjectRepository {
  let projects: LabelProject[] = [];
  let nextId = 0;

  return {
    async list() {
      return [...projects];
    },
    async create(name) {
      const project: LabelProject = { id: `p${nextId++}`, name };
      projects = [...projects, project];
      return project;
    },
    async rename(id, name) {
      projects = projects.map((project) =>
        project.id === id ? { ...project, name } : project,
      );
      const renamed = projects.find((project) => project.id === id);
      if (!renamed) {
        throw new Error("Project not found");
      }
      return renamed;
    },
    async remove(id) {
      projects = projects.filter((project) => project.id !== id);
    },
    ...overrides,
  };
}

async function createProjectViaUi(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.type(screen.getByLabelText("Project name"), name);
  await user.click(screen.getByRole("button", { name: "Create project" }));
}

describe("ProjectsPage", () => {
  it("shows an empty state with no projects", () => {
    render(<ProjectsPage repository={createFakeRepository()} />);

    expect(
      screen.getByText("No projects yet. Create one to get started."),
    ).toBeInTheDocument();
  });

  it("creates a project and lists it", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage repository={createFakeRepository()} />);

    await createProjectViaUi(user, "Pantry Jars");

    const list = await screen.findByRole("list");
    expect(within(list).getByRole("listitem")).toHaveTextContent("Pantry Jars");
  });

  it("opens a project from the list on request", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage repository={createFakeRepository()} />);

    await createProjectViaUi(user, "Pantry Jars");
    await createProjectViaUi(user, "Spice Jars");
    expect(
      await screen.findByRole("heading", { name: "Editing Spice Jars" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open Pantry Jars" }));

    expect(
      screen.getByRole("heading", { name: "Editing Pantry Jars" }),
    ).toBeInTheDocument();
  });

  it("opens a project and renames it without changing identity", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage repository={createFakeRepository()} />);

    await createProjectViaUi(user, "Pantry Jars");

    expect(
      await screen.findByRole("heading", { name: "Editing Pantry Jars" }),
    ).toBeInTheDocument();

    const renameInput = screen.getByLabelText("Rename project");
    await user.clear(renameInput);
    await user.type(renameInput, "Spice Jars");
    await user.click(screen.getByRole("button", { name: "Save name" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Editing Spice Jars" }),
      ).toBeInTheDocument();
    });
    const listItem = within(screen.getByRole("list")).getByRole("listitem");
    expect(listItem).toHaveTextContent("Spice Jars");
    expect(listItem).not.toHaveTextContent("Pantry Jars");
  });

  it("preserves the project when deletion is cancelled", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage repository={createFakeRepository()} />);

    await createProjectViaUi(user, "Pantry Jars");
    await user.click(
      await screen.findByRole("button", { name: "Delete Pantry Jars" }),
    );

    expect(
      screen.getByRole("alertdialog", { name: "Delete project?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("list")).getByRole("listitem"),
    ).toHaveTextContent("Pantry Jars");
  });

  it("removes the project only after confirming deletion", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage repository={createFakeRepository()} />);

    await createProjectViaUi(user, "Pantry Jars");
    await user.click(
      await screen.findByRole("button", { name: "Delete Pantry Jars" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(
        screen.getByText("No projects yet. Create one to get started."),
      ).toBeInTheDocument();
    });
  });

  it("keeps the project listed and reports an error when deletion fails", async () => {
    const user = userEvent.setup();
    const repository = createFakeRepository({
      remove: async () => {
        throw new Error("boom");
      },
    });
    render(<ProjectsPage repository={repository} />);

    await createProjectViaUi(user, "Pantry Jars");
    await user.click(
      await screen.findByRole("button", { name: "Delete Pantry Jars" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not delete the project. Try again.",
    );
    expect(
      within(screen.getByRole("list")).getByRole("listitem"),
    ).toHaveTextContent("Pantry Jars");
  });
});
