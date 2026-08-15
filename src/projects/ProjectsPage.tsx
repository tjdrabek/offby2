import { useRef, useState } from "react";
import { createIndexedDbProjectRepository } from "./IndexedDbProjectRepository";
import type { ProjectRepository } from "./ProjectRepository";
import { useProjects } from "./useProjects";
import { useProjectRecovery } from "./useProjectRecovery";
import ProjectCreateForm from "./ProjectCreateForm";
import ProjectList from "./ProjectList";
import ProjectRenameForm from "./ProjectRenameForm";
import ProjectRecoveryBanner from "./ProjectRecoveryBanner";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
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

  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);

  const openProject =
    projects.find((project) => project.id === openProjectId) ?? null;
  const pendingDeleteProject =
    projects.find((project) => project.id === pendingDeleteId) ?? null;

  async function handleCreate(name: string) {
    setError(null);
    try {
      const project = await createProject(name);
      setOpenProjectId(project.id);
    } catch {
      setError("Could not create the project. Try again.");
    }
  }

  async function handleRename(name: string) {
    if (!openProject) {
      return;
    }
    setError(null);
    try {
      await renameProject(openProject.id, name);
      await activeRepository.clearDraft(openProject.id).catch(() => undefined);
    } catch {
      setError("Could not rename the project. Try again.");
    }
  }

  function handleDraftChange(name: string | null) {
    if (!openProject) {
      return;
    }
    const saved = name
      ? activeRepository.saveDraft(openProject.id, name)
      : activeRepository.clearDraft(openProject.id);
    // A failed draft write must not interrupt typing; the committed project
    // is still authoritative and recovery simply won't be offered.
    saved.catch(() => undefined);
  }

  function requestDelete(id: string, trigger: HTMLElement) {
    deleteTriggerRef.current = trigger;
    setError(null);
    setPendingDeleteId(id);
  }

  function cancelDelete() {
    setPendingDeleteId(null);
    deleteTriggerRef.current?.focus();
  }

  async function confirmDelete() {
    if (!pendingDeleteId) {
      return;
    }
    setDeleting(true);
    try {
      await deleteProject(pendingDeleteId);
      if (openProjectId === pendingDeleteId) {
        setOpenProjectId(null);
      }
      setPendingDeleteId(null);
      deleteTriggerRef.current?.focus();
    } catch {
      setError("Could not delete the project. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  const visibleError = error ?? loadError;

  return (
    <div className="projects-page">
      {recovery.status.kind !== "clean" && (
        <ProjectRecoveryBanner
          status={recovery.status}
          pending={recovery.pending}
          onRecover={() => void recovery.recover()}
          onDiscard={() => void recovery.discard()}
          onDismissUnreadable={() => void recovery.dismissUnreadable()}
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
      <ProjectCreateForm onCreate={handleCreate} />
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
        <DeleteConfirmDialog
          projectName={pendingDeleteProject.name}
          pending={deleting}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

export default ProjectsPage;
