import type { ProjectRecord } from "./ProjectRecord";
import type { ProjectDraftRecord } from "./ProjectDraft";
import {
  PROJECTS_STORE,
  PROJECT_DRAFTS_STORE,
  withStore,
} from "../storage/database";

export function listProjectRecords(): Promise<ProjectRecord[]> {
  return withStore(PROJECTS_STORE, "readonly", (store) => store.getAll());
}

export function getProjectRecord(
  id: string,
): Promise<ProjectRecord | undefined> {
  return withStore(PROJECTS_STORE, "readonly", (store) => store.get(id));
}

export function putProjectRecord(record: ProjectRecord): Promise<void> {
  return withStore(PROJECTS_STORE, "readwrite", (store) =>
    store.put(record),
  ).then(() => undefined);
}

export function deleteProjectRecord(id: string): Promise<void> {
  return withStore(PROJECTS_STORE, "readwrite", (store) => store.delete(id));
}

/** Raw stored values: durable drafts may predate the current schema, so callers must validate. */
export function listProjectDrafts(): Promise<unknown[]> {
  return withStore(PROJECT_DRAFTS_STORE, "readonly", (store) => store.getAll());
}

export function putProjectDraft(record: ProjectDraftRecord): Promise<void> {
  return withStore(PROJECT_DRAFTS_STORE, "readwrite", (store) =>
    store.put(record),
  ).then(() => undefined);
}

export function deleteProjectDraft(projectId: string): Promise<void> {
  return withStore(PROJECT_DRAFTS_STORE, "readwrite", (store) =>
    store.delete(projectId),
  );
}

export function clearProjectDrafts(): Promise<void> {
  return withStore(PROJECT_DRAFTS_STORE, "readwrite", (store) => store.clear());
}
