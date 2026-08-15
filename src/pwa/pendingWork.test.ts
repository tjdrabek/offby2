import { describe, expect, it, vi } from "vitest";
import { createPendingWorkTracker } from "./pendingWork";

describe("createPendingWorkTracker", () => {
  it("resolves when there is nothing to flush", async () => {
    await expect(createPendingWorkTracker().flush()).resolves.toBeUndefined();
  });

  it("flushes every registered source", async () => {
    const tracker = createPendingWorkTracker();
    const first = vi.fn().mockResolvedValue(undefined);
    const second = vi.fn().mockResolvedValue(undefined);
    tracker.register(first);
    tracker.register(second);

    await tracker.flush();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("still attempts the other sources when one fails", async () => {
    const tracker = createPendingWorkTracker();
    const failing = vi.fn().mockRejectedValue(new Error("write failed"));
    const other = vi.fn().mockResolvedValue(undefined);
    tracker.register(failing);
    tracker.register(other);

    await expect(tracker.flush()).rejects.toThrow("write failed");
    expect(other).toHaveBeenCalledTimes(1);
  });

  it("ignores a source once it is unregistered", async () => {
    const tracker = createPendingWorkTracker();
    const flush = vi.fn().mockResolvedValue(undefined);
    const unregister = tracker.register(flush);

    unregister();
    await tracker.flush();

    expect(flush).not.toHaveBeenCalled();
  });
});
