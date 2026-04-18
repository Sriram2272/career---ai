import { useMemo } from "react";

interface Faculty {
  department: string | null;
}

interface DepartmentFilterProps {
  faculty: Faculty[];
  selected: string;
  onChange: (dept: string) => void;
}

const DepartmentFilter = ({ faculty, selected, onChange }: DepartmentFilterProps) => {
  const departments = useMemo(() => {
    const counts: Record<string, number> = {};
    faculty.forEach(f => {
      const d = f.department || "Unassigned";
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [faculty]);

  if (departments.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange("")}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          !selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        All ({faculty.length})
      </button>
      {departments.map(([dept, count]) => (
        <button
          key={dept}
          onClick={() => onChange(dept)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            selected === dept ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {dept} ({count})
        </button>
      ))}
    </div>
  );
};

export default DepartmentFilter;
