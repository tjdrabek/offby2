import { describe, expect, it } from "vitest";
import {
  FIRST_REVISION_NUMBER,
  SHEET_LAYOUT_SCHEMA_VERSION,
  SheetLayoutSaveRefusedError,
  createSheetLayoutRecord,
  createSheetLayoutRevisionRecord,
  isSheetLayoutRevisionRecord,
  normalizeSheetLayoutName,
  upgradeSheetLayoutRevisionRecord,
  withLatestRevision,
  type SheetLayoutRevisionRecord,
} from "./SheetLayoutRecord";
import {
  contradictorySheetLayout,
  resolvedSheetLayout,
  sheetLayoutInput,
} from "./testing/sheetLayoutFixtures";
import { resolveSheetLayout } from "./resolveSheetLayout";
import { withCornerRadiusState } from "./SheetLayoutInput";

const REF = { layoutId: "layout-1", revisionNumber: FIRST_REVISION_NUMBER };

function revision(layout = resolvedSheetLayout(), now = 1_700_000_000_000) {
  return createSheetLayoutRevisionRecord(REF, layout, now);
}

describe("createSheetLayoutRecord", () => {
  it("creates a stable identity that starts at revision 1", () => {
    const record = createSheetLayoutRecord("layout-1", "  Avery L7160  ", 42);

    expect(record).toEqual({
      id: "layout-1",
      name: "Avery L7160",
      schemaVersion: SHEET_LAYOUT_SCHEMA_VERSION,
      createdAt: 42,
      updatedAt: 42,
      latestRevisionNumber: 1,
    });
  });

  it("refuses an empty name", () => {
    expect(() => normalizeSheetLayoutName("   ")).toThrow(/cannot be empty/);
  });

  it("advances the revision pointer without touching the identity", () => {
    const record = createSheetLayoutRecord("layout-1", "Avery L7160", 42);

    const advanced = withLatestRevision(record, 2, 99);

    expect(advanced).toEqual({
      ...record,
      latestRevisionNumber: 2,
      updatedAt: 99,
    });
    expect(record.latestRevisionNumber).toBe(1);
  });
});

describe("createSheetLayoutRevisionRecord", () => {
  it("carries schema version, timestamp, geometry, sources and radius state", () => {
    const record = revision();

    expect(record.layoutId).toBe("layout-1");
    expect(record.revisionNumber).toBe(1);
    expect(record.schemaVersion).toBe(SHEET_LAYOUT_SCHEMA_VERSION);
    expect(record.createdAt).toBe(1_700_000_000_000);
    expect(record.geometry.sheet).toEqual({ widthMm: 210, heightMm: 297 });
    expect(record.geometry.grid).toEqual({ rows: 7, columns: 3 });
    expect(record.geometry.cornerRadius).toEqual({ state: "zero" });
    expect(record.sources.measurements.labelWidth).toEqual({
      text: "60",
      unit: "mm",
      notation: "decimal",
    });
    expect(record.sources.counts).toEqual({ rows: 7, columns: 3 });
    expect(record.derivations).toEqual([]);
  });

  it("retains the entered unit and notation rather than the normalized value", () => {
    // 220.5 = 10 + 3 × 63.5 + 2 × 5 + 10, with the label entered in inches.
    const input = sheetLayoutInput({ sheetWidth: "220.5" });
    const resolution = resolveSheetLayout({
      ...input,
      measurements: {
        ...input.measurements,
        labelWidth: { text: "2 1/2", unit: "in" },
      },
    });
    if (resolution.status !== "resolved") {
      throw new Error("Expected the mixed-unit sheet to resolve.");
    }

    const record = createSheetLayoutRevisionRecord(REF, resolution.layout, 1);

    expect(record.geometry.label.widthMm).toBe(63.5);
    expect(record.sources.measurements.labelWidth).toEqual({
      text: "2 1/2",
      unit: "in",
      notation: "fraction",
    });
  });

  it("records a radius state that carries its own measurement", () => {
    const input = withCornerRadiusState(sheetLayoutInput(), "estimated", "mm");
    const resolution = resolveSheetLayout({
      ...input,
      cornerRadius: { state: "estimated", value: { text: "3", unit: "mm" } },
    });
    if (resolution.status !== "resolved") {
      throw new Error("Expected the rounded sheet to resolve.");
    }

    const record = createSheetLayoutRevisionRecord(REF, resolution.layout, 1);

    expect(record.geometry.cornerRadius).toEqual({
      state: "estimated",
      radiusMm: 3,
    });
    expect(record.sources.cornerRadius).toEqual({
      text: "3",
      unit: "mm",
      notation: "decimal",
    });
  });

  it("has no source text for a derived dimension, and discloses the equation instead", () => {
    const record = revision(resolvedSheetLayout({ marginLeft: "" }));

    expect(record.sources.measurements.marginLeft).toBeNull();
    expect(record.sources.measurements.marginRight).toEqual({
      text: "10",
      unit: "mm",
      notation: "decimal",
    });
    expect(record.geometry.margins.leftMm).toBe(10);
    expect(record.derivations.map((one) => one.field)).toEqual(["marginLeft"]);
    expect(record.derivations[0].substitution).toContain("210");
  });

  it("refuses to build a revision from geometry that cannot describe a sheet", () => {
    expect(() =>
      createSheetLayoutRevisionRecord(REF, contradictorySheetLayout(), 1),
    ).toThrow(SheetLayoutSaveRefusedError);

    try {
      createSheetLayoutRevisionRecord(REF, contradictorySheetLayout(), 1);
    } catch (error) {
      const refused = error as SheetLayoutSaveRefusedError;
      expect(refused.refusals.map((refusal) => refusal.code)).toContain(
        "geometry-extent-contradiction",
      );
    }
  });

  it("refuses a revision number below the first one", () => {
    expect(() =>
      createSheetLayoutRevisionRecord(
        { layoutId: "layout-1", revisionNumber: 0 },
        resolvedSheetLayout(),
        1,
      ),
    ).toThrow(/Revision numbers start at 1/);
  });

  it("cannot be edited in place", () => {
    const record = revision();

    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.geometry)).toBe(true);
    expect(() => {
      (record as { revisionNumber: number }).revisionNumber = 5;
    }).toThrow(TypeError);
    expect(() => {
      (record.geometry.sheet as { widthMm: number }).widthMm = 999;
    }).toThrow(TypeError);
  });

  it("keeps its own copy of the geometry it was given", () => {
    const layout = resolvedSheetLayout();
    const record = revision(layout);

    (layout.geometry.grid as { rows: number }).rows = 99;

    expect(record.geometry.grid.rows).toBe(7);
  });
});

describe("isSheetLayoutRevisionRecord", () => {
  it("accepts a record this version wrote", () => {
    expect(isSheetLayoutRevisionRecord(revision())).toBe(true);
  });

  it.each([
    ["a non-object", "revision"],
    ["null", null],
    ["a record from another schema", { ...revision(), schemaVersion: 99 }],
    ["a record with no layout", { ...revision(), layoutId: "" }],
    ["a record numbered zero", { ...revision(), revisionNumber: 0 }],
    [
      "a record with a fractional number",
      { ...revision(), revisionNumber: 1.5 },
    ],
  ])("rejects %s", (_label, value) => {
    expect(isSheetLayoutRevisionRecord(value)).toBe(false);
  });
});

describe("upgradeSheetLayoutRevisionRecord", () => {
  /** A revision as schema 1 wrote it: one derivation, in a field of its own. */
  function schemaOne(derivation: unknown) {
    const rest: Partial<SheetLayoutRevisionRecord> = {
      ...revision(resolvedSheetLayout({ marginLeft: "" })),
    };
    delete rest.derivations;
    return { ...rest, schemaVersion: 1, derivation };
  }

  it("turns a single derivation into a list of one", () => {
    const current = revision(resolvedSheetLayout({ marginLeft: "" }));
    const upgraded = upgradeSheetLayoutRevisionRecord(
      schemaOne(current.derivations[0]),
    );

    expect(isSheetLayoutRevisionRecord(upgraded)).toBe(true);
    expect((upgraded as SheetLayoutRevisionRecord).derivations).toEqual([
      current.derivations[0],
    ]);
  });

  it("turns no derivation into an empty list", () => {
    const upgraded = upgradeSheetLayoutRevisionRecord(schemaOne(null));

    expect(isSheetLayoutRevisionRecord(upgraded)).toBe(true);
    expect((upgraded as SheetLayoutRevisionRecord).derivations).toEqual([]);
  });

  it("stamps the current schema version", () => {
    const upgraded = upgradeSheetLayoutRevisionRecord(schemaOne(null));

    expect((upgraded as SheetLayoutRevisionRecord).schemaVersion).toBe(
      SHEET_LAYOUT_SCHEMA_VERSION,
    );
  });

  it("keeps everything else about the revision", () => {
    const legacy = schemaOne(null);
    const upgraded = upgradeSheetLayoutRevisionRecord(
      legacy,
    ) as SheetLayoutRevisionRecord;

    expect(upgraded.layoutId).toBe(legacy.layoutId);
    expect(upgraded.revisionNumber).toBe(legacy.revisionNumber);
    expect(upgraded.createdAt).toBe(legacy.createdAt);
    expect(upgraded.geometry).toEqual(legacy.geometry);
    expect(upgraded.sources).toEqual(legacy.sources);
    expect("derivation" in upgraded).toBe(false);
  });

  it("leaves a current record and a non-record alone", () => {
    const current = revision();

    expect(upgradeSheetLayoutRevisionRecord(current)).toBe(current);
    expect(upgradeSheetLayoutRevisionRecord("revision")).toBe("revision");
    expect(upgradeSheetLayoutRevisionRecord(null)).toBeNull();
  });
});
