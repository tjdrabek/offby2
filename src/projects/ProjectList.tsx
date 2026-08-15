import type { LabelProject } from "./LabelProject";

interface ProjectListProps {
  projects: LabelProject[];
  openProjectId: string | null;
  onOpen: (id: string) => void;
  onRequestDelete: (id: string) => void;
}

function ProjectList({
  projects,
  openProjectId,
  onOpen,
  onRequestDelete,
}: ProjectListProps) {
  if (projects.length === 0) {
    return <p>No projects yet. Create one to get started.</p>;
  }

  return (
    <ul className="project-list" aria-label="Projects">
      {projects.map((project) => {
        const isOpen = project.id === openProjectId;
        return (
          <li key={project.id}>
            <span>
              {project.name}
              {isOpen ? " (open)" : ""}
            </span>
            <button type="button" onClick={() => onOpen(project.id)}>
              {isOpen
                ? `Currently open: ${project.name}`
                : `Open ${project.name}`}
            </button>
            <button type="button" onClick={() => onRequestDelete(project.id)}>
              {`Delete ${project.name}`}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default ProjectList;
