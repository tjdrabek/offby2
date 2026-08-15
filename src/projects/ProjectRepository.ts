import type { LabelProject } from "./LabelProject";

export interface ProjectRepository {
  list(): Promise<LabelProject[]>;
  create(name: string): Promise<LabelProject>;
  rename(id: string, name: string): Promise<LabelProject>;
  remove(id: string): Promise<void>;
  /** Returns raw stored values; durable data may predate the current schema, so callers must validate. */
  listDrafts(): Promise<unknown[]>;
  saveDraft(projectId: string, draftName: string): Promise<void>;
  clearDraft(projectId: string): Promise<void>;
  clearAllDrafts(): Promise<void>;
}
