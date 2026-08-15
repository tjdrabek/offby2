import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDraftPersistence } from "./useDraftPersistence";
import { createFakeProjectRepository } from "./testing/fakeProjectRepository";
import type { ProjectRepository } from "./ProjectRepository";

const DEBOUNCE_MS = 400;

function renderDraftPersistence(repository: ProjectRepository) {
  return renderHook(() => useDraftPersistence(repository));
}

describe("useDraftPersistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes one debounced draft instead of one per keystroke", async () => {
    const saveDraft = vi.fn().mockResolvedValue(undefined);
    const repository = createFakeProjectRepository({ saveDraft });
    const { result } = renderDraftPersistence(repository);

    act(() => {
      result.current.record("p0", "S");
      result.current.record("p0", "Sp");
      result.current.record("p0", "Spice");
    });
    expect(saveDraft).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    });

    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(saveDraft).toHaveBeenCalledWith("p0", "Spice");
  });

  it("writes the pending draft immediately when flushed", async () => {
    const saveDraft = vi.fn().mockResolvedValue(undefined);
    const repository = createFakeProjectRepository({ saveDraft });
    const { result } = renderDraftPersistence(repository);

    act(() => {
      result.current.record("p0", "Spice Jars");
    });
    await act(async () => {
      await result.current.flush();
    });

    expect(saveDraft).toHaveBeenCalledWith("p0", "Spice Jars");

    // The scheduled write must have been cancelled, not merely pre-empted.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    });
    expect(saveDraft).toHaveBeenCalledTimes(1);
  });

  it("clears the marker when the draft matches the saved name", async () => {
    const clearDraft = vi.fn().mockResolvedValue(undefined);
    const repository = createFakeProjectRepository({ clearDraft });
    const { result } = renderDraftPersistence(repository);

    act(() => {
      result.current.record("p0", null);
    });
    await act(async () => {
      await result.current.flush();
    });

    expect(clearDraft).toHaveBeenCalledWith("p0");
  });

  it("resolves without writing when nothing is pending", async () => {
    const saveDraft = vi.fn().mockResolvedValue(undefined);
    const repository = createFakeProjectRepository({ saveDraft });
    const { result } = renderDraftPersistence(repository);

    await act(async () => {
      await result.current.flush();
    });

    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("keeps typing alive when a background write fails, then reports it on flush", async () => {
    const saveDraft = vi
      .fn()
      .mockRejectedValueOnce(new Error("IndexedDB transaction was aborted."))
      .mockResolvedValue(undefined);
    const repository = createFakeProjectRepository({ saveDraft });
    const { result } = renderDraftPersistence(repository);

    act(() => {
      result.current.record("p0", "Spice Jars");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    });

    // The failure is silent, but the value is still not durable.
    expect(saveDraft).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.flush();
    });

    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(saveDraft).toHaveBeenLastCalledWith("p0", "Spice Jars");
  });

  it("rejects the flush while the draft is still not durable", async () => {
    const saveDraft = vi
      .fn()
      .mockRejectedValue(new Error("The local database is unavailable."));
    const repository = createFakeProjectRepository({ saveDraft });
    const { result } = renderDraftPersistence(repository);

    act(() => {
      result.current.record("p0", "Spice Jars");
    });

    await act(async () => {
      await expect(result.current.flush()).rejects.toThrow(
        "The local database is unavailable.",
      );
    });
  });

  it("does not lose a keystroke made while a write was in flight", async () => {
    let resolveFirst = () => {};
    const saveDraft = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue(undefined);
    const repository = createFakeProjectRepository({ saveDraft });
    const { result } = renderDraftPersistence(repository);

    act(() => {
      result.current.record("p0", "Spice");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    });
    act(() => {
      result.current.record("p0", "Spice Jars");
    });

    await act(async () => {
      const flushed = result.current.flush();
      resolveFirst();
      await flushed;
    });

    expect(saveDraft).toHaveBeenLastCalledWith("p0", "Spice Jars");
  });

  it("stops a scheduled write after unmount", async () => {
    const saveDraft = vi.fn().mockResolvedValue(undefined);
    const repository = createFakeProjectRepository({ saveDraft });
    const { result, unmount } = renderDraftPersistence(repository);

    act(() => {
      result.current.record("p0", "Spice Jars");
    });
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    });

    expect(saveDraft).not.toHaveBeenCalled();
  });
});
