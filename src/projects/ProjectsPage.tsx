import { useCallback, useRef, useState } from "react";
import { createIndexedDbProjectRepository } from "./IndexedDbProjectRepository";
import type { ProjectRepository } from "./ProjectRepository";
import { useProjects } from "./useProjects";
import { useProjectRecovery } from "./useProjectRecovery";
import { useDraftPersistence } from "./useDraftPersistence";
import { usePendingWorkRegistration } from "../pwa/pendingWorkContext";
import ProjectCreateForm from "./ProjectCreateForm";
import ProjectList from "./ProjectList";
import ProjectRenameForm from "./ProjectRenameForm";
import ProjectRecoveryBanner from "./ProjectRecoveryBanner";
import ConfirmDialog from "../ui/ConfirmDialog";
import StatusRegion from "../ui/StatusRegion";
import "./ProjectsPage.css";

interface ProjectsPageProps {
  repository?: ProjectRepository;
}

function ProjectsPage({ repository }: ProjectsPageProps) {
  const [defaultRepository] = useState(() =>
    createIndexedDbProjectRepository(),
  );
  const activeRepository = repository ?? defaultRepository;
  const {
    projects,
    loaded,
    loadError,
    createProject,
    renameProject,
    deleteProject,
  } = useProjects(activeRepository);
  const recovery = useProjectRecovery(
    activeRepository,
    projects,
    loaded,
    renameProject,
  );
  const draft = useDraftPersistence(activeRepository);
  // The shell must be able to make this page's unsaved rename durable before
  // it allows a service-worker update to replace the running page.
  usePendingWorkRegistration(draft.flush);

  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const createNameRef = useRef<HTMLInputElement>(null);

  // The create field is the page's first action, so it is where focus goes
  // whenever a workflow removes the control the user was standing on.
  const focusFallback = useCallback(() => createNameRef.current, []);

  const openProject =
    projects.find((project) => project.id === openProjectId) ?? null;
  const pendingDeleteProject =
    projects.find((project) => project.id === pendingDeleteId) ?? null;

  async function handleCreate(name: string) {
    setError(null);
    setStatus(null);
    try {
      const project = await createProject(name);
      setOpenProjectId(project.id);
      setStatus(`Project "${project.name}" created and opened for editing.`);
    } catch {
      setError("Could not create the project. Try again.");
    }
  }

  async function handleRename(name: string) {
    if (!openProject) {
      return;
    }
    setError(null);
    setStatus(null);
    try {
      await renameProject(openProject.id, name);
      // The saved name is now authoritative, so the recovery marker must go.
      draft.record(openProject.id, null);
      await draft.flush().catch(() => undefined);
      setStatus(`Project renamed to "${name}".`);
    } catch {
      setError("Could not rename the project. Try again.");
    }
  }

  const handleDraftChange = useCallback(
    (name: string | null) => {
      if (!openProjectId) {
        return;
      }
      draft.record(openProjectId, name);
    },
    [draft, openProjectId],
  );

  function requestDelete(id: string) {
    setError(null);
    setStatus(null);
    setPendingDeleteId(id);
  }

  function cancelDelete() {
    setPendingDeleteId(null);
  }

  async function confirmDelete() {
    if (!pendingDeleteProject) {
      return;
    }
    const deletedName = pendingDeleteProject.name;
    setDeleting(true);
    try {
      await deleteProject(pendingDeleteProject.id);
      if (openProjectId === pendingDeleteProject.id) {
        setOpenProjectId(null);
      }
      setPendingDeleteId(null);
      setStatus(`Project "${deletedName}" deleted.`);
    } catch {
      setError("Could not delete the project. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  // Resolving recovery removes the banner the user is standing in, so each of
  // these has to hand focus somewhere itself.
  async function handleRecover() {
    const draftName =
      recovery.status.kind === "recoverable" ? recovery.status.draftName : null;
    setStatus(null);
    if (await recovery.recover()) {
      setStatus(
        `Unsaved changes recovered. Project renamed to "${draftName}".`,
      );
      focusFallback()?.focus();
    }
  }

  async function handleDiscard() {
    setStatus(null);
    if (await recovery.discard()) {
      setStatus("Unsaved changes discarded. Your saved project is unchanged.");
      focusFallback()?.focus();
    }
  }

  async function handleDismissUnreadable() {
    setStatus(null);
    if (await recovery.dismissUnreadable()) {
      setStatus("Saved recovery data cleared.");
      focusFallback()?.focus();
    }
  }

  const visibleError = error ?? loadError;

  return (
    <div className="projects-page">
      <StatusRegion label="Project status" className="projects-status">
        {status}
      </StatusRegion>
      {recovery.status.kind !== "clean" && (
        <ProjectRecoveryBanner
          status={recovery.status}
          pending={recovery.pending}
          onRecover={() => void handleRecover()}
          onDiscard={() => void handleDiscard()}
          onDismissUnreadable={() => void handleDismissUnreadable()}
          focusFallback={focusFallback}
        />
      )}
      {recovery.actionError && (
        <p role="alert" className="projects-error">
          {recovery.actionError}
        </p>
      )}
      {visibleError && (
        <p role="alert" className="projects-error">
          {visibleError}
        </p>
      )}
      <ProjectCreateForm onCreate={handleCreate} inputRef={createNameRef} />
      <ProjectList
        projects={projects}
        openProjectId={openProjectId}
        onOpen={setOpenProjectId}
        onRequestDelete={requestDelete}
      />
      {openProject && (
        <ProjectRenameForm
          key={openProject.id}
          project={openProject}
          onRename={handleRename}
          onDraftChange={handleDraftChange}
        />
      )}
      {pendingDeleteProject && (
        <ConfirmDialog
          title="Delete project?"
          description={`Delete "${pendingDeleteProject.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          pending={deleting}
          onCancel={cancelDelete}
          onConfirm={() => void confirmDelete()}
          // Deleting removes the row the dialog was opened from.
          restoreFocusFallback={focusFallback}
        />
      )}
    </div>
  );
}

export default ProjectsPage;
