import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { SKIP_WAITING_MESSAGE } from "./serviceWorkerUpdate";
import { useServiceWorkerUpdate } from "./useServiceWorkerUpdate";
import {
  FakeServiceWorkerContainer,
  FakeServiceWorkerRegistration,
} from "./testing/fakeServiceWorker";

interface HarnessOptions {
  flushPendingWork?: () => Promise<void>;
  withUpdate?: boolean;
}

/** Renders the hook against fake service-worker plumbing. */
function renderUpdate({
  flushPendingWork,
  withUpdate = true,
}: HarnessOptions = {}) {
  const registration = new FakeServiceWorkerRegistration();
  const container = new FakeServiceWorkerContainer();
  const reload = vi.fn();
  const waiting = withUpdate ? registration.installUpdate() : null;

  const view = renderHook(() =>
    useServiceWorkerUpdate({
      registration: registration.asRegistration(),
      container: container.asContainer(),
      flushPendingWork,
      reload,
    }),
  );

  return { ...view, registration, container, reload, waiting };
}

describe("useServiceWorkerUpdate", () => {
  it("announces a waiting worker without touching it", () => {
    const { result, waiting } = renderUpdate();

    expect(result.current.state).toEqual({ status: "waiting" });
    expect(waiting?.messages).toEqual([]);
  });

  it("stays idle while no update is waiting", () => {
    const { result } = renderUpdate({ withUpdate: false });

    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("makes open work durable before it activates the update", async () => {
    const order: string[] = [];
    let releaseFlush = () => {};
    const flushPendingWork = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          order.push("flush started");
          releaseFlush = () => {
            order.push("flush resolved");
            resolve();
          };
        }),
    );
    const { result, waiting } = renderUpdate({ flushPendingWork });

    let activation: Promise<void>;
    act(() => {
      activation = result.current.activate();
    });

    // The waiting worker must not be told to take over while the draft write
    // is still outstanding.
    expect(waiting?.messages).toEqual([]);
    expect(result.current.state).toEqual({ status: "activating" });

    await act(async () => {
      releaseFlush();
      await activation;
    });

    expect(order).toEqual(["flush started", "flush resolved"]);
    expect(waiting?.messages).toEqual([SKIP_WAITING_MESSAGE]);
  });

  it("blocks activation and offers a retry when the work cannot be saved", async () => {
    const flushPendingWork = vi
      .fn()
      .mockRejectedValueOnce(new Error("The local database is unavailable."))
      .mockResolvedValueOnce(undefined);
    const { result, waiting, reload } = renderUpdate({ flushPendingWork });

    await act(async () => {
      await result.current.activate();
    });

    expect(result.current.state).toEqual({
      status: "failed",
      reason: "The local database is unavailable.",
    });
    expect(waiting?.messages).toEqual([]);
    expect(reload).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.activate();
    });

    expect(waiting?.messages).toEqual([SKIP_WAITING_MESSAGE]);
  });

  it("reports an unusable non-Error failure in readable terms", async () => {
    const flushPendingWork = vi.fn().mockRejectedValue({ code: 22 });
    const { result } = renderUpdate({ flushPendingWork });

    await act(async () => {
      await result.current.activate();
    });

    expect(result.current.state).toEqual({
      status: "failed",
      reason: "Your changes could not be saved to this browser.",
    });
  });

  it("reloads exactly once after an accepted activation takes effect", async () => {
    const { result, registration, container, reload } = renderUpdate({
      flushPendingWork: () => Promise.resolve(),
    });

    await act(async () => {
      await result.current.activate();
    });
    act(() => {
      registration.finishActivation();
      container.changeController();
      container.changeController();
    });

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("never reloads over work this page did not accept", () => {
    const { container, reload } = renderUpdate();

    // Another tab accepted the update; this page may hold unsaved work.
    act(() => {
      container.changeController();
    });

    expect(reload).not.toHaveBeenCalled();
  });

  it("leaves the waiting worker alone when the update is postponed", async () => {
    const flushPendingWork = vi.fn();
    const { result, waiting, reload } = renderUpdate({ flushPendingWork });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.state).toEqual({ status: "dismissed" });
    expect(flushPendingWork).not.toHaveBeenCalled();
    expect(waiting?.messages).toEqual([]);
    expect(reload).not.toHaveBeenCalled();

    // A postponed update is not re-announced by later lifecycle noise.
    act(() => {
      waiting?.setState("installed");
    });
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "dismissed" }),
    );
  });

  it("reports a missing waiting worker instead of pretending to update", async () => {
    const { result } = renderUpdate({
      withUpdate: false,
      flushPendingWork: () => Promise.resolve(),
    });

    await act(async () => {
      await result.current.activate();
    });

    expect(result.current.state).toMatchObject({ status: "failed" });
  });
});
