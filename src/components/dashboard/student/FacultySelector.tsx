// FacultySelector - removed (faculty table dropped)
// This component is no longer used in PlaceAI

interface FacultySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FacultySelector = ({ value, onChange, placeholder = "Enter name..." }: FacultySelectorProps) => {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
    />
  );
};

export default FacultySelector;