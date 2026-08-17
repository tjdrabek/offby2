import { useId, useState, type FormEvent } from "react";
import type { SheetLayoutRecord } from "./SheetLayoutRecord";

interface SheetLayoutSaveFormProps {
  /** The layout the next revision would be appended to, or null to create a new one. */
  openLayout: SheetLayoutRecord | null;
  pending: boolean;
  onCreate: (name: string) => void;
  onAppend: () => void;
}

/**
 * Saves the checked measurements, either as a new layout's revision 1 or as
 * the next revision of the layout being viewed.
 *
 * The two are separate buttons rather than one button whose meaning depends on
 * selection, because appending to the wrong layout and creating a duplicate are
 * different mistakes and neither should be made silently. The next revision
 * number is named in the button, so what is about to be written is readable
 * before it is written.
 */
function SheetLayoutSaveForm({
  openLayout,
  pending,
  onCreate,
  onAppend,
}: SheetLayoutSaveFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nameId = useId();
  const errorId = useId();
  const headingId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a name for this sheet layout.");
      return;
    }
    setError(null);
    onCreate(name.trim());
    setName("");
  }

  return (
    <section className="sheet-layout-save" aria-labelledby={headingId}>
      <h2 id={headingId}>Save this sheet layout</h2>
      <p className="sheet-layout-note">
        A saved revision never changes. Correcting a measurement adds the next
        revision and leaves every earlier one exactly as it was saved.
      </p>
      {openLayout && (
        <button
          type="button"
          disabled={pending}
          onClick={onAppend}
        >{`Save as revision ${openLayout.latestRevisionNumber + 1} of ${openLayout.name}`}</button>
      )}
      <form className="sheet-layout-save-form" onSubmit={handleSubmit}>
        <div className="sheet-layout-field">
          <label htmlFor={nameId}>Sheet layout name</label>
          <input
            id={nameId}
            name="sheetLayoutName"
            type="text"
            value={name}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {error && (
            <p className="sheet-layout-field-error" id={errorId}>
              {error}
            </p>
          )}
        </div>
        <button type="submit" disabled={pending}>
          Save as a new sheet layout
        </button>
      </form>
    </section>
  );
}

export default SheetLayoutSaveForm;
