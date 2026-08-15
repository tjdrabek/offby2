import { useState, type FormEvent } from "react";
import type { LabelProject } from "./LabelProject";

interface ProjectRenameFormProps {
  project: LabelProject;
  onRename: (name: string) => void;
}

/** Callers must remount this with `key={project.id}` when the open project changes. */
function ProjectRenameForm({ project, onRename }: ProjectRenameFormProps) {
  const [name, setName] = useState(project.name);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError("Project name cannot be empty.");
      return;
    }
    setValidationError(null);
    onRename(trimmed);
  }

  return (
    <form className="project-rename-form" onSubmit={handleSubmit}>
      <h2>{`Editing ${project.name}`}</h2>
      <label htmlFor="rename-project-name">Rename project</label>
      <input
        id="rename-project-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button type="submit">Save name</button>
      {validationError && <p role="alert">{validationError}</p>}
    </form>
  );
}

export default ProjectRenameForm;
