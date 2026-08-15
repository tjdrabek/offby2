import { describe, expect, it, vi } from "vitest";
import {
  SERVICE_WORKER_SCOPE,
  SERVICE_WORKER_URL,
  registerServiceWorker,
} from "./serviceWorkerRegistration";

/**
 * Builds a minimal ServiceWorkerContainer stub. Only `register` is exercised.
 */
function createContainer(
  register: ServiceWorkerContainer["register"],
): ServiceWorkerContainer {
  return { register } as unknown as ServiceWorkerContainer;
}

describe("registerServiceWorker", () => {
  it("registers the emitted worker under the origin-wide scope", async () => {
    const registration = { scope: "http://localhost:4173/" };
    const register = vi.fn().mockResolvedValue(registration);

    const result = await registerServiceWorker({
      enabled: true,
      container: createContainer(register),
    });

    expect(register).toHaveBeenCalledWith(SERVICE_WORKER_URL, {
      scope: SERVICE_WORKER_SCOPE,
    });
    expect(result).toEqual({
      status: "registered",
      scope: "http://localhost:4173/",
      // Carried through so the host can observe the update lifecycle.
      registration,
    });
  });

  it("does not attempt registration when disabled", async () => {
    const register = vi.fn();

    const result = await registerServiceWorker({
      enabled: false,
      container: createContainer(register),
    });

    expect(register).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "disabled" });
  });

  it("reports an unsupported browser without throwing", async () => {
    const result = await registerServiceWorker({
      enabled: true,
      container: undefined,
    });

    // jsdom's navigator has no serviceWorker property.
    expect(result).toEqual({ status: "unsupported" });
  });

  it("resolves with an actionable reason when registration is rejected", async () => {
    const register = vi
      .fn()
      .mockRejectedValue(new Error("SecurityError: insecure context"));

    const result = await registerServiceWorker({
      enabled: true,
      container: createContainer(register),
    });

    expect(result).toEqual({
      status: "failed",
      reason: "SecurityError: insecure context",
    });
  });

  it("describes non-Error rejections rather than surfacing undefined", async () => {
    const register = vi.fn().mockRejectedValue({});

    const result = await registerServiceWorker({
      enabled: true,
      container: createContainer(register),
    });

    expect(result.status).toBe("failed");
    expect(result).toHaveProperty(
      "reason",
      "The browser rejected the service worker registration.",
    );
  });
});
