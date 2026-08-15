import { describe, expect, it, vi } from "vitest";
import {
  SKIP_WAITING_MESSAGE,
  activateWaitingWorker,
  observeWaitingWorker,
} from "./serviceWorkerUpdate";
import { FakeServiceWorkerRegistration } from "./testing/fakeServiceWorker";

describe("observeWaitingWorker", () => {
  it("reports a worker that is already waiting on subscribe", () => {
    const registration = new FakeServiceWorkerRegistration();
    registration.installUpdate();
    const onWaitingChange = vi.fn();

    observeWaitingWorker(registration.asRegistration(), onWaitingChange);

    expect(onWaitingChange).toHaveBeenCalledWith(true);
  });

  it("reports an update that finishes installing later", () => {
    const registration = new FakeServiceWorkerRegistration();
    const onWaitingChange = vi.fn();
    observeWaitingWorker(registration.asRegistration(), onWaitingChange);
    expect(onWaitingChange).toHaveBeenLastCalledWith(false);

    registration.installUpdate();

    expect(onWaitingChange).toHaveBeenLastCalledWith(true);
  });

  it("reports that nothing is waiting once the worker takes over", () => {
    const registration = new FakeServiceWorkerRegistration();
    const onWaitingChange = vi.fn();
    observeWaitingWorker(registration.asRegistration(), onWaitingChange);
    registration.installUpdate();

    registration.finishActivation();

    expect(onWaitingChange).toHaveBeenLastCalledWith(false);
  });

  it("stops reporting after unsubscribing", () => {
    const registration = new FakeServiceWorkerRegistration();
    const onWaitingChange = vi.fn();
    const unsubscribe = observeWaitingWorker(
      registration.asRegistration(),
      onWaitingChange,
    );

    unsubscribe();
    registration.installUpdate();

    expect(onWaitingChange).toHaveBeenCalledTimes(1);
    expect(onWaitingChange).toHaveBeenCalledWith(false);
  });
});

describe("activateWaitingWorker", () => {
  it("asks only the waiting worker to skip waiting", () => {
    const registration = new FakeServiceWorkerRegistration();
    const waiting = registration.installUpdate();

    activateWaitingWorker(registration.asRegistration());

    expect(waiting.messages).toEqual([SKIP_WAITING_MESSAGE]);
  });

  it("refuses when there is nothing waiting", () => {
    const registration = new FakeServiceWorkerRegistration();

    expect(() => activateWaitingWorker(registration.asRegistration())).toThrow(
      /no waiting update/i,
    );
  });
});
