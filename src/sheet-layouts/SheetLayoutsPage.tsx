import SheetLayoutForm from "./SheetLayoutForm";
import type { SheetLayoutSourceInput } from "./SheetLayoutInput";
import type { NormalizedSheetLayout } from "./validateSheetLayoutInput";

interface SheetLayoutsPageProps {
  onSubmit?: (
    input: SheetLayoutSourceInput,
    normalized: NormalizedSheetLayout,
  ) => void;
}

function SheetLayoutsPage({ onSubmit }: SheetLayoutsPageProps) {
  return (
    <div className="sheet-layouts-page">
      <SheetLayoutForm onSubmit={onSubmit} />
    </div>
  );
}

export default SheetLayoutsPage;
