import { useRef, useState } from "react";
import { createInMemoryProjectRepository } from "./InMemoryProjectRepository";
import type { ProjectRepository } from "./ProjectRepository";
import { useProjects } from "./useProjects";
import ProjectCreateForm from "./ProjectCreateForm";
import ProjectList from "./ProjectList";
import ProjectRenameForm from "./ProjectRenameForm";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import "./ProjectsPage.css";

interface ProjectsPageProps {
  repository?: ProjectRepository;
}

function ProjectsPage({ repository }: ProjectsPageProps) {
  const [defaultRepository] = useState(() => createInMemoryProjectRepository());
  const activeRepository = repository ?? defaultRepository;
  const { projects, createProject, renameProject, deleteProject } =
    useProjects(activeRepository);

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
    } catch {
      setError("Could not rename the project. Try again.");
    }
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

  return (
    <div className="projects-page">
      {error && (
        <p role="alert" className="projects-error">
          {error}
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
