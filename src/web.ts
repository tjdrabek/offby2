/**
 * offby2/web — browser conveniences over the engine's content boundary.
 *
 * Two adapters, and no arithmetic in either: a web developer styles a
 * preview from the CSS custom-property map and verifies the rendering with
 * the element readback shim, without writing conversion code. Every number
 * is computed by the core (`offby2`); this entry point only names numbers
 * for a stylesheet and gathers numbers from an element.
 *
 * The custom-property names are package interface, documented in
 * `contentBoundaryCssVars`: `--offby2-boundary-x`/`-y` for where content
 * stops, and `--offby2-line-<name>-x`/`-y` for each hold-in line's own
 * position.
 */

// Styling: the boundary as custom properties a stylesheet multiplies.
export {
  BOUNDARY_X_VAR,
  BOUNDARY_Y_VAR,
  contentBoundaryCssVars,
  lineCssVarNames,
  type ContentBoundaryCssVars,
} from "./web/contentBoundaryCssVars";

// Verifying: numbers gathered from a rendered element, for the core's
// `judgeBoundaryAgreement` to judge.
export {
  boundaryReadback,
  type ReadbackFrame,
  type ReadbackPart,
} from "./web/boundaryReadback";
