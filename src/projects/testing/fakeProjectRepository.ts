import type { LabelProject } from "../LabelProject";
import type { ProjectRepository } from "../ProjectRepository";
import { createProjectDraftRecord } from "../ProjectDraft";

/** In-memory {@link ProjectRepository} for tests; override any method to simulate failures. */
export function createFakeProjectRepository(
  overrides: Partial<ProjectRepository> = {},
): ProjectRepository {
  let projects: LabelProject[] = [];
  let drafts: unknown[] = [];
  let nextId = 0;
  // Monotonic stand-in for Date.now(), which is too coarse to order writes
  // made within the same millisecond.
  let clock = 0;

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
        throw new Error(`Project not found: ${id}`);
      }
      return renamed;
    },
    async remove(id) {
      projects = projects.filter((project) => project.id !== id);
    },
    async listDrafts() {
      return [...drafts];
    },
    async saveDraft(projectId, draftName) {
      drafts = [
        ...drafts.filter(
          (draft) => (draft as { projectId?: string }).projectId !== projectId,
        ),
        createProjectDraftRecord(projectId, draftName, ++clock),
      ];
    },
    async clearDraft(projectId) {
      drafts = drafts.filter(
        (draft) => (draft as { projectId?: string }).projectId !== projectId,
      );
    },
    async clearAllDrafts() {
      drafts = [];
    },
    ...overrides,
  };
}
