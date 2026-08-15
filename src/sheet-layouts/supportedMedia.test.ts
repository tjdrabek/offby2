import { describe, expect, it } from "vitest";
import {
  SUPPORTED_MEDIA_KIND,
  UNSUPPORTED_MEDIA,
  describeUnsupportedMedia,
  unsupportedMediaMessage,
} from "./supportedMedia";

describe("supportedMedia", () => {
  it("treats the one uniform-grid kind as supported", () => {
    expect(describeUnsupportedMedia(SUPPORTED_MEDIA_KIND)).toBeNull();
  });

  it.each(UNSUPPORTED_MEDIA.map((media) => media.kind))(
    "refuses %s with its own reason",
    (kind) => {
      const description = describeUnsupportedMedia(kind);

      expect(description?.kind).toBe(kind);
      expect(unsupportedMediaMessage(description!)).toContain(
        description!.reason,
      );
    },
  );

  it("names every media the PRD calls out as unsupported", () => {
    expect(UNSUPPORTED_MEDIA.map((media) => media.kind)).toEqual(
      expect.arrayContaining([
        "non-uniform-grid",
        "non-rectangular-sheet",
        "circular-labels",
        "oval-labels",
        "arbitrary-die-cut",
        "roll",
        "continuous",
        "thermal-continuous",
        "duplex",
      ]),
    );
  });

  it("refuses media it has never heard of rather than assuming a grid", () => {
    const description = describeUnsupportedMedia("hexagonal-honeycomb");

    expect(description).not.toBeNull();
    expect(unsupportedMediaMessage(description!)).toContain(
      "hexagonal-honeycomb",
    );
  });

  it("states what supported media is in every refusal", () => {
    for (const media of UNSUPPORTED_MEDIA) {
      expect(unsupportedMediaMessage(media)).toContain(
        "uniform axis-aligned grid",
      );
    }
  });
});
