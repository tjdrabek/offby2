import SheetLayoutForm from "./SheetLayoutForm";
import type { SheetLayoutSourceInput } from "./SheetLayoutInput";
import type { ResolvedSheetLayout } from "./resolveSheetLayout";

interface SheetLayoutsPageProps {
  onSubmit?: (
    input: SheetLayoutSourceInput,
    resolved: ResolvedSheetLayout,
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
