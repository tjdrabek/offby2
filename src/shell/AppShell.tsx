import { DESTINATIONS } from "./destinations";
import { useCurrentDestination } from "./useCurrentDestination";
import ProjectsPage from "../projects/ProjectsPage";
import OfflineCapabilityWarning from "../pwa/OfflineCapabilityWarning";
import { useServiceWorkerRegistration } from "../pwa/useServiceWorkerRegistration";
import "./AppShell.css";

function AppShell() {
  const current = useCurrentDestination();
  const serviceWorker = useServiceWorkerRegistration();

  return (
    <div className="app-shell">
      <nav className="app-shell-nav" aria-label="Primary">
        <ul>
          {DESTINATIONS.map((destination) => (
            <li key={destination.id}>
              <a
                href={`#${destination.path}`}
                aria-current={
                  destination.id === current.id ? "page" : undefined
                }
              >
                {destination.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="app-shell-main">
        <OfflineCapabilityWarning status={serviceWorker} />
        <h1>{current.label}</h1>
        {current.id === "projects" && <ProjectsPage />}
      </main>
    </div>
  );
}

export default AppShell;
