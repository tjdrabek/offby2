import type { LabelProject } from "./LabelProject";

/** Bumped whenever the durable project record shape changes; carried per-record for migration. */
export const PROJECT_SCHEMA_VERSION = 1;

/** Versioned durable value stored in IndexedDB; the UI only ever sees the minimal {@link LabelProject}. */
export interface ProjectRecord {
  id: string;
  name: string;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
}

export function normalizeProjectName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Project name cannot be empty.");
  }
  return trimmed;
}

export function createProjectRecord(
  id: string,
  name: string,
  now: number,
): ProjectRecord {
  return {
    id,
    name: normalizeProjectName(name),
    schemaVersion: PROJECT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}

export function toLabelProject(record: ProjectRecord): LabelProject {
  return { id: record.id, name: record.name };
}
