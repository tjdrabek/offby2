import type { ProjectRepository } from "./ProjectRepository";
import {
  createProjectRecord,
  normalizeProjectName,
  toLabelProject,
} from "./ProjectRecord";
import { createProjectDraftRecord } from "./ProjectDraft";
import {
  clearProjectDrafts,
  deleteProjectDraft,
  deleteProjectRecord,
  getProjectRecord,
  listProjectDrafts,
  listProjectRecords,
  putProjectDraft,
  putProjectRecord,
} from "./projectsDatabase";

/** Feature-oriented repository backed by IndexedDB; UI code never touches the database directly. */
export function createIndexedDbProjectRepository(): ProjectRepository {
  return {
    async list() {
      const records = await listProjectRecords();
      // Tie-break on id: IndexedDB returns records in random UUID key order,
      // so createdAt alone leaves same-millisecond creations unordered.
      return records
        .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
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
    listDrafts() {
      return listProjectDrafts();
    },
    saveDraft(projectId, draftName) {
      return putProjectDraft(
        createProjectDraftRecord(projectId, draftName, Date.now()),
      );
    },
    clearDraft(projectId) {
      return deleteProjectDraft(projectId);
    },
    clearAllDrafts() {
      return clearProjectDrafts();
    },
  };
}
