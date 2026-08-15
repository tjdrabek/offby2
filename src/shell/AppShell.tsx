import { useRef, useState } from "react";
import { DESTINATIONS } from "./destinations";
import { useCurrentDestination } from "./useCurrentDestination";
import ProjectsPage from "../projects/ProjectsPage";
import SheetLayoutsPage from "../sheet-layouts/SheetLayoutsPage";
import OfflineCapabilityWarning from "../pwa/OfflineCapabilityWarning";
import UpdateNotice from "../pwa/UpdateNotice";
import { useServiceWorkerRegistration } from "../pwa/useServiceWorkerRegistration";
import { useServiceWorkerUpdate } from "../pwa/useServiceWorkerUpdate";
import { createPendingWorkTracker } from "../pwa/pendingWork";
import { PendingWorkContext } from "../pwa/pendingWorkContext";
import "./AppShell.css";

function AppShell() {
  const current = useCurrentDestination();
  const serviceWorker = useServiceWorkerRegistration();
  // Pages register their unsaved work here so an update can be refused while
  // anything is still not durable.
  const [pendingWork] = useState(createPendingWorkTracker);
  const update = useServiceWorkerUpdate({
    registration:
      serviceWorker.status === "registered" ? serviceWorker.registration : null,
    flushPendingWork: pendingWork.flush,
  });
  const mainRef = useRef<HTMLElement>(null);

  return (
    <PendingWorkContext value={pendingWork}>
      <div className="app-shell">
        <a
          className="skip-link"
          href="#main-content"
          onClick={(event) => {
            // Destinations are routed on the URL hash, so following the
            // fragment would navigate away. Move focus directly instead.
            event.preventDefault();
            mainRef.current?.focus();
          }}
        >
          Skip to main content
        </a>
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
        <main
          className="app-shell-main"
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
        >
          <UpdateNotice
            state={update.state}
            onUpdate={() => void update.activate()}
            onDismiss={update.dismiss}
          />
          <OfflineCapabilityWarning status={serviceWorker} />
          <h1>{current.label}</h1>
          {current.id === "projects" && <ProjectsPage />}
          {current.id === "sheet-layouts" && <SheetLayoutsPage />}
        </main>
      </div>
    </PendingWorkContext>
  );
}

export default AppShell;
