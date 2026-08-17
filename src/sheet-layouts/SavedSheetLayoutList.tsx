import type { SheetLayoutRecord } from "./SheetLayoutRecord";

interface SavedSheetLayoutListProps {
  layouts: readonly SheetLayoutRecord[];
  openLayoutId: string | null;
  onOpen: (id: string) => void;
}

/** The saved layout identities. Geometry belongs to revisions, so none is shown here. */
function SavedSheetLayoutList({
  layouts,
  openLayoutId,
  onOpen,
}: SavedSheetLayoutListProps) {
  if (layouts.length === 0) {
    return (
      <p>No sheet layouts saved yet. Check measurements, then save them.</p>
    );
  }

  return (
    <ul className="sheet-layout-list" aria-label="Saved sheet layouts">
      {layouts.map((layout) => {
        const isOpen = layout.id === openLayoutId;
        return (
          <li key={layout.id}>
            <span>
              {layout.name}
              {` — ${layout.latestRevisionNumber} revision${layout.latestRevisionNumber === 1 ? "" : "s"}`}
              {isOpen ? " (open)" : ""}
            </span>
            <button type="button" onClick={() => onOpen(layout.id)}>
              {isOpen
                ? `Currently open: ${layout.name}`
                : `Open ${layout.name}`}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default SavedSheetLayoutList;
