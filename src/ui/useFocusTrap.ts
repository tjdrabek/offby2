import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Focusable descendants in DOM order. Deliberately does not filter on layout
 * (offsetParent/getBoundingClientRect), because that information does not exist
 * in a jsdom unit test and a modal dialog has no hidden controls anyway.
 */
function focusableElementsIn(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => element.getAttribute("aria-hidden") !== "true");
}

interface FocusTrapOptions {
  /** Called on Escape. Owners that are mid-write should ignore it themselves. */
  onEscape?: () => void;
  /**
   * Where to send focus when the element that opened the trap no longer exists
   * — deleting the row you opened the dialog from removes its own trigger, and
   * focus must not fall back to `<body>`.
   */
  restoreFocusFallback?: () => HTMLElement | null;
}

/**
 * Moves focus into the returned container on mount, keeps Tab and Shift+Tab
 * cycling inside it, and restores focus to the opener (or a fallback) on
 * unmount. The container must be focusable itself (`tabIndex={-1}`) so focus
 * has somewhere to land when it holds no enabled controls.
 */
export function useFocusTrap<T extends HTMLElement>(
  options: FocusTrapOptions = {},
): RefObject<T | null> {
  const containerRef = useRef<T>(null);
  const optionsRef = useRef(options);

  // Refreshed before the mount effect runs on mount, and after every later
  // render, so the long-lived listener always calls the current callbacks.
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    // Re-bound with a non-nullable type so the long-lived listener below keeps
    // the narrowing across the closure boundary.
    const container: HTMLElement = containerRef.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    (focusableElementsIn(container)[0] ?? container).focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        optionsRef.current.onEscape?.();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const focusable = focusableElementsIn(container);
      const active = document.activeElement;
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const outside = !(active instanceof Node) || !container.contains(active);
      if (event.shiftKey) {
        if (outside || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (outside || active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const target =
        opener?.isConnected === true
          ? opener
          : (optionsRef.current.restoreFocusFallback?.() ?? null);
      target?.focus();
    };
    // Mount-only: the trap exists for exactly as long as the dialog does.
  }, []);

  return containerRef;
}
