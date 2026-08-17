import { formatMillimetres } from "./measurementUnits";
import type { Millimetres } from "./SheetGeometry";
import type {
  SheetLayoutRecord,
  SheetLayoutRevisionRecord,
} from "./SheetLayoutRecord";

interface SheetLayoutRevisionListProps {
  layout: SheetLayoutRecord;
  revisions: readonly SheetLayoutRevisionRecord[];
}

/** "215.9 × 279.4" — millimetres, which is what a revision stores. */
function size(width: Millimetres, height: Millimetres): string {
  return `${formatMillimetres(width, "mm")} × ${formatMillimetres(height, "mm")}`;
}

/**
 * Every revision of the open layout, oldest first.
 *
 * Each row is an exact reference — layout identity plus revision number — and
 * shows the geometry that revision holds, so an earlier revision can be read
 * unchanged beside the correction that came after it. Values are shown in the
 * millimetres they are stored in; the form's measurement unit is an entry
 * preference and does not restate saved geometry.
 */
function SheetLayoutRevisionList({
  layout,
  revisions,
}: SheetLayoutRevisionListProps) {
  if (revisions.length === 0) {
    return null;
  }

  return (
    <table className="sheet-layout-normalized">
      <caption>{`Revisions of ${layout.name}`}</caption>
      <thead>
        <tr>
          <th scope="col">Revision</th>
          <th scope="col">Sheet (mm)</th>
          <th scope="col">Label (mm)</th>
          <th scope="col">Grid</th>
          <th scope="col">Corner radius</th>
        </tr>
      </thead>
      <tbody>
        {revisions.map((revision) => {
          const { geometry } = revision;
          const radius = geometry.cornerRadius;
          return (
            <tr key={revision.revisionNumber}>
              <th scope="row">{`Revision ${revision.revisionNumber}`}</th>
              <td>{size(geometry.sheet.widthMm, geometry.sheet.heightMm)}</td>
              <td>{size(geometry.label.widthMm, geometry.label.heightMm)}</td>
              <td>{`${geometry.grid.rows} × ${geometry.grid.columns}`}</td>
              <td>
                {radius.state === "known" || radius.state === "estimated"
                  ? `${radius.state} ${formatMillimetres(radius.radiusMm, "mm")}`
                  : radius.state}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default SheetLayoutRevisionList;
