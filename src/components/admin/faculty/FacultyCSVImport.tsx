// Placeholder — faculty table removed in PlaceAI migration
const FacultyCSVImport = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="p-4 text-center text-sm text-muted-foreground">
      <p>CSV import not available in PlaceAI.</p>
      <button onClick={onClose} className="mt-2 text-xs text-primary hover:underline">Close</button>
    </div>
  );
};

export default FacultyCSVImport;