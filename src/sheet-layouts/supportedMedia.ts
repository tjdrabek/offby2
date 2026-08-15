/**
 * The closed set of media this application can describe.
 *
 * Supported media is one thing only: a rectangular sheet carrying a uniform
 * axis-aligned grid of identical square or rounded-rectangle labels. The form
 * refuses everything else by construction — there is no media control to pick
 * a roll or a circular die from — but a media kind can still arrive from
 * catalog data or an imported workspace, and those need an explicit reason
 * rather than a silent approximation.
 *
 * Each unsupported kind is listed with why it is out of scope, so a refusal
 * says what the media actually is instead of only what it is not.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

export const SUPPORTED_MEDIA_KIND = "uniform-rectangular-grid";

export type SupportedMediaKind = typeof SUPPORTED_MEDIA_KIND;

export type UnsupportedMediaKind =
  | "non-uniform-grid"
  | "non-rectangular-sheet"
  | "circular-labels"
  | "oval-labels"
  | "arbitrary-die-cut"
  | "roll"
  | "continuous"
  | "thermal-continuous"
  | "duplex";

export type MediaKind = SupportedMediaKind | UnsupportedMediaKind;

export interface UnsupportedMediaDescription {
  kind: UnsupportedMediaKind;
  /** How the media is named to a reader. */
  label: string;
  /** Why it cannot be described, in terms of what this application models. */
  reason: string;
}

/** What supported media is, stated once and reused by every refusal message. */
export const SUPPORTED_MEDIA_DESCRIPTION =
  "Supported media is a rectangular sheet carrying a uniform axis-aligned grid of identical square or rounded-rectangle labels.";

export const UNSUPPORTED_MEDIA: readonly UnsupportedMediaDescription[] = [
  {
    kind: "non-uniform-grid",
    label: "A sheet whose labels are not all the same size",
    reason:
      "Every label on a supported sheet has one width and one height, so labels of differing sizes cannot be represented.",
  },
  {
    kind: "non-rectangular-sheet",
    label: "A sheet that is not rectangular",
    reason:
      "Sheet coordinates are a rectangle measured from one corner, so another sheet outline cannot be represented.",
  },
  {
    kind: "circular-labels",
    label: "Circular labels",
    reason:
      "Label boundaries are rectangles with an optional corner radius, and a circle is not one of them.",
  },
  {
    kind: "oval-labels",
    label: "Oval labels",
    reason:
      "Label boundaries are rectangles with an optional corner radius, and an ellipse is not one of them.",
  },
  {
    kind: "arbitrary-die-cut",
    label: "Arbitrary die-cut shapes",
    reason:
      "An arbitrary outline cannot be described by a width, a height, and a corner radius.",
  },
  {
    kind: "roll",
    label: "Roll stock",
    reason:
      "A roll has no fixed sheet extent, so there is nothing to measure margins or a grid against.",
  },
  {
    kind: "continuous",
    label: "Continuous stock",
    reason:
      "Continuous stock has no fixed sheet extent, so there is nothing to measure margins or a grid against.",
  },
  {
    kind: "thermal-continuous",
    label: "Continuous thermal stock",
    reason:
      "Continuous thermal stock has no fixed sheet extent, and its feed is not a page this application can position content on.",
  },
  {
    kind: "duplex",
    label: "Duplex (two-sided) media",
    reason:
      "A layout describes one side of one sheet, so a second printed side has no representation.",
  },
];

/**
 * The description of an unsupported media kind, or null when the kind is the
 * one supported kind. An unrecognised string is unsupported by default: media
 * this application has never heard of is never assumed to be a uniform grid.
 */
export function describeUnsupportedMedia(
  kind: string,
): UnsupportedMediaDescription | null {
  if (kind === SUPPORTED_MEDIA_KIND) {
    return null;
  }
  return (
    UNSUPPORTED_MEDIA.find((media) => media.kind === kind) ?? {
      kind: "arbitrary-die-cut",
      label: `Media described as "${kind}"`,
      reason: "This application has no model for that media.",
    }
  );
}

/** One sentence naming the media and why it cannot be described here. */
export function unsupportedMediaMessage(
  media: UnsupportedMediaDescription,
): string {
  return `${media.label} cannot be described. ${media.reason} ${SUPPORTED_MEDIA_DESCRIPTION}`;
}
