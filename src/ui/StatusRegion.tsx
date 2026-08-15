import type { ReactNode } from "react";

interface StatusRegionProps {
  /** Distinguishes this region from the other live regions on the page. */
  label: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Always-mounted polite live region. Mounting it empty and filling it later is
 * what makes the message reliably announced — a region injected at the same
 * moment as its content often is not — and it never moves focus.
 */
function StatusRegion({ label, className, children }: StatusRegionProps) {
  return (
    <div className={className} role="status" aria-label={label}>
      {children}
    </div>
  );
}

export default StatusRegion;
