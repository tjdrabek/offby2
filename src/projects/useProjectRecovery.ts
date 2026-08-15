import { useCallback, useEffect, useState } from "react";
import type { LabelProject } from "./LabelProject";
import type { ProjectRepository } from "./ProjectRepository";
import {
  detectProjectRecovery,
  type ProjectRecoveryStatus,
} from "./projectRecovery";

/** Detects a recoverable project-name draft once projects have loaded, and exposes recover/discard actions. */
export function useProjectRecovery(
  repository: ProjectRepository,
  projects: LabelProject[],
  projectsLoaded: boolean,
  renameProject: (id: string, name: string) => Promise<LabelProject>,
) {
  const [status, setStatus] = useState<ProjectRecoveryStatus>({
    kind: "clean",
  });
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectsLoaded || checked) {
      return;
    }
    let cancelled = false;
    detectProjectRecovery(repository, projects).then((result) => {
      if (!cancelled) {
        setStatus(result);
        setChecked(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [repository, projects, projectsLoaded, checked]);

  const recover = useCallback(async () => {
    if (status.kind !== "recoverable") {
      return;
    }
    setPending(true);
    setActionError(null);
    try {
      // Commit first: if clearing the marker fails, recovery is still offered
      // next time rather than losing the draft.
      await renameProject(status.projectId, status.draftName);
      await repository.clearDraft(status.projectId);
      setStatus({ kind: "clean" });
    } catch {
      setActionError("Could not recover the saved changes. Try again.");
    } finally {
      setPending(false);
    }
  }, [repository, renameProject, status]);

  const discard = useCallback(async () => {
    if (status.kind !== "recoverable") {
      return;
    }
    setPending(true);
    setActionError(null);
    try {
      await repository.clearDraft(status.projectId);
      setStatus({ kind: "clean" });
    } catch {
      setActionError("Could not discard the saved changes. Try again.");
    } finally {
      setPending(false);
    }
  }, [repository, status]);

  const dismissUnreadable = useCallback(async () => {
    setPending(true);
    setActionError(null);
    try {
      await repository.clearAllDrafts();
      setStatus({ kind: "clean" });
    } catch {
      setActionError("Could not clear the saved recovery data. Try again.");
    } finally {
      setPending(false);
    }
  }, [repository]);

  return { status, pending, actionError, recover, discard, dismissUnreadable };
}
