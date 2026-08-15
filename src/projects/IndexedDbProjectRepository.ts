import type { ProjectRepository } from "./ProjectRepository";
import {
  createProjectRecord,
  normalizeProjectName,
  toLabelProject,
} from "./ProjectRecord";
import {
  deleteProjectRecord,
  getProjectRecord,
  listProjectRecords,
  putProjectRecord,
} from "./projectsDatabase";

/** Feature-oriented repository backed by IndexedDB; UI code never touches the database directly. */
export function createIndexedDbProjectRepository(): ProjectRepository {
  return {
    async list() {
      const records = await listProjectRecords();
      return records
        .sort((a, b) => a.createdAt - b.createdAt)
        .map(toLabelProject);
    },
    async create(name) {
      const record = createProjectRecord(crypto.randomUUID(), name, Date.now());
      await putProjectRecord(record);
      return toLabelProject(record);
    },
    async rename(id, name) {
      const existing = await getProjectRecord(id);
      if (!existing) {
        throw new Error(`Project not found: ${id}`);
      }
      const renamed = {
        ...existing,
        name: normalizeProjectName(name),
        updatedAt: Date.now(),
      };
      await putProjectRecord(renamed);
      return toLabelProject(renamed);
    },
    async remove(id) {
      const existing = await getProjectRecord(id);
      if (!existing) {
        throw new Error(`Project not found: ${id}`);
      }
      await deleteProjectRecord(id);
    },
  };
}
