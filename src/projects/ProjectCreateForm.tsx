import { useState, type FormEvent } from "react";

interface ProjectCreateFormProps {
  onCreate: (name: string) => void;
}

function ProjectCreateForm({ onCreate }: ProjectCreateFormProps) {
  const [name, setName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    onCreate(trimmed);
    setName("");
  }

  return (
    <form className="project-create-form" onSubmit={handleSubmit}>
      <label htmlFor="new-project-name">Project name</label>
      <input
        id="new-project-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button type="submit">Create project</button>
    </form>
  );
}

export default ProjectCreateForm;
