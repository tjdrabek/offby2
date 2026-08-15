import { useEffect, useRef, useState, type FormEvent } from "react";
import type { LabelProject } from "./LabelProject";

interface ProjectRenameFormProps {
  project: LabelProject;
  onRename: (name: string) => void;
  /**
   * Reports the pending unsaved name, or null once it matches the saved name.
   * Reported on every change so the owner always knows what is unsaved; the
   * owner decides when to write it. Must be referentially stable.
   */
  onDraftChange?: (name: string | null) => void;
}

/** Callers must remount this with `key={project.id}` when the open project changes. */
function ProjectRenameForm({
  project,
  onRename,
  onDraftChange,
}: ProjectRenameFormProps) {
  const [name, setName] = useState(project.name);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (!onDraftChange) {
      return;
    }
    const trimmed = name.trim();
    onDraftChange(trimmed && trimmed !== project.name ? trimmed : null);
  }, [name, project.name, onDraftChange]);

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
