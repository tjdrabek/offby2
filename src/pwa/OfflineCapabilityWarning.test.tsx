import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import OfflineCapabilityWarning from "./OfflineCapabilityWarning";
import type { ServiceWorkerStatus } from "./serviceWorkerRegistration";
import { useServiceWorkerRegistration } from "./useServiceWorkerRegistration";

const SILENT_STATUSES: ServiceWorkerStatus[] = [
  { status: "pending" },
  { status: "disabled" },
  { status: "unsupported" },
  {
    status: "registered",
    scope: "http://localhost:4173/",
    registration: {} as ServiceWorkerRegistration,
  },
];

function createContainer(
  register: ServiceWorkerContainer["register"],
): ServiceWorkerContainer {
  return { register } as unknown as ServiceWorkerContainer;
}

function Host({ container }: { container: ServiceWorkerContainer }) {
  const status = useServiceWorkerRegistration({ enabled: true, container });
  return (
    <>
      <OfflineCapabilityWarning status={status} />
      <p>Application content</p>
    </>
  );
}

describe("OfflineCapabilityWarning", () => {
  it.each(SILENT_STATUSES)("renders nothing for $status", (status) => {
    const { container } = render(<OfflineCapabilityWarning status={status} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("names the failure without relying on colour alone", () => {
    render(
      <OfflineCapabilityWarning
        status={{ status: "failed", reason: "network error" }}
      />,
    );

    const warning = screen.getByRole("status");
    expect(warning).toHaveTextContent("Warning:");
    expect(warning).toHaveTextContent("offline use is unavailable");
    expect(warning).toHaveTextContent("network error");
  });

  it("warns after a failed registration while still rendering the application", async () => {
    render(
      <Host
        container={createContainer(
          vi.fn().mockRejectedValue(new Error("network error")),
        )}
      />,
    );

    expect(screen.getByText("Application content")).toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "network error",
    );
  });

  it("stays silent once registration succeeds", async () => {
    const register = vi.fn().mockResolvedValue({ scope: "http://x/" });
    render(<Host container={createContainer(register)} />);

    expect(screen.getByText("Application content")).toBeInTheDocument();
    await vi.waitFor(() => expect(register).toHaveBeenCalled());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
