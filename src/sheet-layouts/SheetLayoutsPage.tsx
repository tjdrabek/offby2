import SheetLayoutForm from "./SheetLayoutForm";
import type { SheetLayoutSourceInput } from "./SheetLayoutInput";

interface SheetLayoutsPageProps {
  onSubmit?: (input: SheetLayoutSourceInput) => void;
}

function SheetLayoutsPage({ onSubmit }: SheetLayoutsPageProps) {
  return (
    <div className="sheet-layouts-page">
      <SheetLayoutForm onSubmit={onSubmit} />
    </div>
  );
}

export default SheetLayoutsPage;
