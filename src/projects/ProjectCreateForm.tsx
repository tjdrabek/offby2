import { useId, useState, type FormEvent, type RefObject } from "react";

interface ProjectCreateFormProps {
  onCreate: (name: string) => void;
  /** Lets the owner send focus here when a workflow ends with no better target. */
  inputRef?: RefObject<HTMLInputElement | null>;
}

function ProjectCreateForm({ onCreate, inputRef }: ProjectCreateFormProps) {
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      // Silently ignoring the submit would leave a keyboard user with no
      // indication that anything happened.
      setValidationError("Enter a project name before creating a project.");
      return;
    }
    setValidationError(null);
    onCreate(trimmed);
    setName("");
  }

  return (
    <form className="project-create-form" onSubmit={handleSubmit}>
      <label htmlFor={inputId}>Project name</label>
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        value={name}
        aria-invalid={validationError ? true : undefined}
        aria-describedby={validationError ? errorId : undefined}
        onChange={(event) => setName(event.target.value)}
      />
      <button type="submit">Create project</button>
      {validationError && (
        <p id={errorId} role="alert" className="projects-error">
          {validationError}
        </p>
      )}
    </form>
  );
}

export default ProjectCreateForm;
