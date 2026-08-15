export const PROJECT_DRAFT_SCHEMA_VERSION = 1;

/** Durable marker for an unsaved project-name edit; written while typing and cleared once the edit is saved. */
export interface ProjectDraftRecord {
  projectId: string;
  schemaVersion: number;
  draftName: string;
  savedAt: number;
}

export function isProjectDraftRecord(
  value: unknown,
): value is ProjectDraftRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Partial<ProjectDraftRecord>;
  return (
    typeof record.projectId === "string" &&
    record.projectId.length > 0 &&
    record.schemaVersion === PROJECT_DRAFT_SCHEMA_VERSION &&
    typeof record.draftName === "string" &&
    record.draftName.trim().length > 0 &&
    typeof record.savedAt === "number" &&
    Number.isFinite(record.savedAt)
  );
}

export function createProjectDraftRecord(
  projectId: string,
  draftName: string,
  now: number,
): ProjectDraftRecord {
  return {
    projectId,
    schemaVersion: PROJECT_DRAFT_SCHEMA_VERSION,
    draftName,
    savedAt: now,
  };
}
