import type { LabelProject } from "./LabelProject";

export interface ProjectRepository {
  list(): Promise<LabelProject[]>;
  create(name: string): Promise<LabelProject>;
  rename(id: string, name: string): Promise<LabelProject>;
  remove(id: string): Promise<void>;
}
