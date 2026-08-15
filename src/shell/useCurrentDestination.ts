import { useEffect, useState } from "react";
import {
  DEFAULT_DESTINATION,
  findDestinationByPath,
  type Destination,
} from "./destinations";

function resolveDestination(hash: string): Destination {
  const path = hash.replace(/^#/, "") || DEFAULT_DESTINATION.path;
  return findDestinationByPath(path) ?? DEFAULT_DESTINATION;
}

export function useCurrentDestination(): Destination {
  const [destination, setDestination] = useState<Destination>(() =>
    resolveDestination(window.location.hash),
  );

  useEffect(() => {
    const handleHashChange = () => {
      setDestination(resolveDestination(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return destination;
}
