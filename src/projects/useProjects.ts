import { useCallback, useEffect, useState } from "react";
import type { LabelProject } from "./LabelProject";
import type { ProjectRepository } from "./ProjectRepository";

export function useProjects(repository: ProjectRepository) {
  const [projects, setProjects] = useState<LabelProject[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    repository
      .list()
      .then((result) => {
        if (!cancelled) {
          setProjects(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Could not load projects. Try again.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
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

  return {
    projects,
    loaded,
    loadError,
    createProject,
    renameProject,
    deleteProject,
  };
}
