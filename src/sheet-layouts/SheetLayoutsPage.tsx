import { useId, useState } from "react";
import SheetLayoutForm from "./SheetLayoutForm";
import SheetLayoutSaveForm from "./SheetLayoutSaveForm";
import SavedSheetLayoutList from "./SavedSheetLayoutList";
import SheetLayoutRevisionList from "./SheetLayoutRevisionList";
import StatusRegion from "../ui/StatusRegion";
import { createIndexedDbSheetLayoutRepository } from "./IndexedDbSheetLayoutRepository";
import { useSheetLayouts } from "./useSheetLayouts";
import { SheetLayoutSaveRefusedError } from "./SheetLayoutRecord";
import type { SheetLayoutRepository } from "./SheetLayoutRepository";
import type { SheetLayoutSourceInput } from "./SheetLayoutInput";
import type { ResolvedSheetLayout } from "./resolveSheetLayout";
import "./SheetLayoutsPage.css";

interface SheetLayoutsPageProps {
  repository?: SheetLayoutRepository;
  onSubmit?: (
    input: SheetLayoutSourceInput,
    resolved: ResolvedSheetLayout,
  ) => void;
}

function SheetLayoutsPage({ repository, onSubmit }: SheetLayoutsPageProps) {
  const [defaultRepository] = useState(() =>
    createIndexedDbSheetLayoutRepository(),
  );
  const activeRepository = repository ?? defaultRepository;
  const [openLayoutId, setOpenLayoutId] = useState<string | null>(null);
  const { layouts, revisions, loadError, createLayout, appendRevision } =
    useSheetLayouts(activeRepository, openLayoutId);

  // Only what the form has accepted can be saved: a refused entry leaves this
  // null, so there is nothing for the save controls to write.
  const [resolved, setResolved] = useState<ResolvedSheetLayout | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savedHeadingId = useId();

  const openLayout =
    layouts.find((layout) => layout.id === openLayoutId) ?? null;

  function handleChecked(
    input: SheetLayoutSourceInput,
    layout: ResolvedSheetLayout,
  ) {
    setResolved(layout);
    setError(null);
    onSubmit?.(input, layout);
  }

  /** Turns a refused or failed save into something readable, never into a partial write. */
  function reportFailure(failure: unknown, fallback: string) {
    setError(
      failure instanceof SheetLayoutSaveRefusedError
        ? failure.message
        : fallback,
    );
  }

  async function handleCreate(name: string) {
    if (!resolved) {
      return;
    }
    setError(null);
    setStatus(null);
    setSaving(true);
    try {
      const saved = await createLayout(name, resolved);
      setOpenLayoutId(saved.layout.id);
      setStatus(
        `Sheet layout "${saved.layout.name}" saved as revision ${saved.revision.revisionNumber}.`,
      );
    } catch (failure) {
      reportFailure(failure, "Could not save the sheet layout. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAppend() {
    if (!resolved || !openLayout) {
      return;
    }
    setError(null);
    setStatus(null);
    setSaving(true);
    try {
      const saved = await appendRevision(openLayout.id, resolved);
      setStatus(
        `Revision ${saved.revision.revisionNumber} of "${saved.layout.name}" saved. Earlier revisions are unchanged.`,
      );
    } catch (failure) {
      reportFailure(failure, "Could not save the revision. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const visibleError = error ?? loadError;

  return (
    <div className="sheet-layouts-page">
      <SheetLayoutForm onSubmit={handleChecked} />
      <StatusRegion
        label="Sheet layout save status"
        className="sheet-layout-status"
      >
        {status}
      </StatusRegion>
      {visibleError && (
        <p role="alert" className="sheet-layout-save-error">
          {visibleError}
        </p>
      )}
      {resolved && (
        <SheetLayoutSaveForm
          openLayout={openLayout}
          pending={saving}
          onCreate={(name) => void handleCreate(name)}
          onAppend={() => void handleAppend()}
        />
      )}
      <section className="sheet-layout-saved" aria-labelledby={savedHeadingId}>
        {/* Named "Saved layouts" rather than "Saved sheet layouts" so it stays
            distinguishable from the destination's own heading. */}
        <h2 id={savedHeadingId}>Saved layouts</h2>
        <SavedSheetLayoutList
          layouts={layouts}
          openLayoutId={openLayoutId}
          onOpen={setOpenLayoutId}
        />
        {openLayout && (
          <SheetLayoutRevisionList layout={openLayout} revisions={revisions} />
        )}
      </section>
    </div>
  );
}

export default SheetLayoutsPage;
