/**
 * The content boundary as CSS custom properties: the package interface a
 * stylesheet reads.
 *
 * Every value is a percentage of the design frame's extent on that axis,
 * written as a bare number so a container-unit stylesheet multiplies it
 * straight: `calc(var(--offby2-boundary-x) * 1cqw)` where the container is
 * the frame. The documented names are:
 *
 * - `--offby2-boundary-x`, `--offby2-boundary-y` — where content stops: the
 *   most obtrusive held line per frame axis.
 * - `--offby2-line-<name>-x`, `--offby2-line-<name>-y` — each hold-in
 *   line's own held distance, for guide lines drawn at their true
 *   positions, including when they cross. `<name>` is the caller's own key
 *   for the line, verbatim, so it must be a CSS-ident-safe name (letters,
 *   digits, hyphens, underscores).
 *
 * This adapter contains zero arithmetic: the numbers are the core's
 * ({@link contentBoundaryPercents}), and this module only names them.
 */

import type { DesignFrame, HoldInLine } from "../sheet-layouts/contentBoundary.js";
import { contentBoundaryPercents } from "../sheet-layouts/contentBoundaryPercents.js";

/** Where content stops across the frame, as a percentage of its width. */
export const BOUNDARY_X_VAR = "--offby2-boundary-x";
/** Where content stops down the frame, as a percentage of its height. */
export const BOUNDARY_Y_VAR = "--offby2-boundary-y";

/** The custom properties carrying one named hold-in line's own distances. */
export function lineCssVarNames(name: string): { xVar: string; yVar: string } {
  return {
    xVar: `--offby2-line-${name}-x`,
    yVar: `--offby2-line-${name}-y`,
  };
}

export type ContentBoundaryCssVars = { [customProperty: string]: string };

/**
 * The custom-property map for a boundary: one engine call, ready to spread
 * into an element's inline style.
 */
export function contentBoundaryCssVars(
  lines: { [name: string]: HoldInLine },
  frame: DesignFrame,
): ContentBoundaryCssVars {
  const percents = contentBoundaryPercents(lines, frame);
  const vars: ContentBoundaryCssVars = {
    [BOUNDARY_X_VAR]: String(percents.xPercent),
    [BOUNDARY_Y_VAR]: String(percents.yPercent),
  };
  for (const [name, line] of Object.entries(percents.lines)) {
    const { xVar, yVar } = lineCssVarNames(name);
    vars[xVar] = String(line.xPercent);
    vars[yVar] = String(line.yPercent);
  }
  return vars;
}
