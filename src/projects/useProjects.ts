import { useCallback, useEffect, useState } from "react";
import type { LabelProject } from "./LabelProject";
import type { ProjectRepository } from "./ProjectRepository";

export function useProjects(repository: ProjectRepository) {
  const [projects, setProjects] = useState<LabelProject[]>([]);

  useEffect(() => {
    let cancelled = false;
    repository.list().then((loaded) => {
      if (!cancelled) {
        setProjects(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const createProject = useCallback(
    async (name: string) => {
      const project = await repository.create(name);
      setProjects((current) => [...current, project]);
      return project;
    },
    [repository],
  );

  const renameProject = useCallback(
    async (id: string, name: string) => {
      const renamed = await repository.rename(id, name);
      setProjects((current) =>
        current.map((project) => (project.id === id ? renamed : project)),
      );
      return renamed;
    },
    [repository],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await repository.remove(id);
      setProjects((current) => current.filter((project) => project.id !== id));
    },
    [repository],
  );

  return { projects, createProject, renameProject, deleteProject };
}
