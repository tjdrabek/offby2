import type { LabelProject } from "./LabelProject";
import type { ProjectRepository } from "./ProjectRepository";
import { isProjectDraftRecord, type ProjectDraftRecord } from "./ProjectDraft";

export type ProjectRecoveryStatus =
  | { kind: "clean" }
  | {
      kind: "recoverable";
      projectId: string;
      projectName: string;
      draftName: string;
      savedAt: number;
    }
  | { kind: "unreadable"; reason: string };

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error.";
}

/**
 * Reads the durable draft markers and reconciles them against known-good
 * projects; never throws, so callers always get a typed result to render.
 */
export async function detectProjectRecovery(
  repository: ProjectRepository,
  projects: LabelProject[],
): Promise<ProjectRecoveryStatus> {
  let drafts: unknown[];
  try {
    drafts = await repository.listDrafts();
  } catch (error) {
    return { kind: "unreadable", reason: describeError(error) };
  }

  const valid = drafts.filter(isProjectDraftRecord) as ProjectDraftRecord[];
  if (drafts.length > 0 && valid.length === 0) {
    return {
      kind: "unreadable",
      reason: "Saved recovery data is in a format this app can't read.",
    };
  }
  if (valid.length === 0) {
    return { kind: "clean" };
  }

  const latest = valid.reduce((a, b) => (a.savedAt >= b.savedAt ? a : b));
  const project = projects.find(
    (candidate) => candidate.id === latest.projectId,
  );
  // A draft that matches (or outlives) its committed project has nothing left
  // to recover, so drop the marker rather than offering a no-op recovery.
  if (!project || project.name === latest.draftName) {
    await repository.clearDraft(latest.projectId).catch(() => undefined);
    return { kind: "clean" };
  }

  return {
    kind: "recoverable",
    projectId: project.id,
    projectName: project.name,
    draftName: latest.draftName,
    savedAt: latest.savedAt,
  };
}
