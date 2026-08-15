import type { LabelProject } from "./LabelProject";
import type { ProjectRepository } from "./ProjectRepository";

/**
 * Placeholder repository used until durable IndexedDB-backed storage lands;
 * satisfies the same contract so callers never depend on where data lives.
 */
export function createInMemoryProjectRepository(): ProjectRepository {
  let projects: LabelProject[] = [];

  return {
    async list() {
      return [...projects];
    },
    async create(name) {
      const project: LabelProject = { id: crypto.randomUUID(), name };
      projects = [...projects, project];
      return project;
    },
    async rename(id, name) {
      const existing = projects.find((project) => project.id === id);
      if (!existing) {
        throw new Error(`Project not found: ${id}`);
      }
      const renamed: LabelProject = { ...existing, name };
      projects = projects.map((project) =>
        project.id === id ? renamed : project,
      );
      return renamed;
    },
    async remove(id) {
      const exists = projects.some((project) => project.id === id);
      if (!exists) {
        throw new Error(`Project not found: ${id}`);
      }
      projects = projects.filter((project) => project.id !== id);
    },
  };
}
