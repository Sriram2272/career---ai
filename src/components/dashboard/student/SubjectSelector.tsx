import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle, BookOpen } from "lucide-react";

export type Subject = {
  code: string;
  name: string;
  credit: number;
  lecture: number;
  practical: number;
  tutorial: number;
  availableOptions: number;
};

const semesterSubjects: Subject[] = [
  { code: "CSE238", name: "COMPUTER NETWORKS", credit: 4, lecture: 3, practical: 2, tutorial: 0, availableOptions: 1 },
  { code: "CSB206", name: "ALGORITHMS AND DATA STRUCTURES II", credit: 5, lecture: 4, practical: 2, tutorial: 0, availableOptions: 0 },
  { code: "CSB207", name: "OBJECT-ORIENTED PROGRAMMING", credit: 4, lecture: 3, practical: 2, tutorial: 0, availableOptions: 0 },
  { code: "CSB208", name: "CLOUD SECURITY", credit: 3, lecture: 3, practical: 0, tutorial: 0, availableOptions: 0 },
  { code: "CSB209", name: "CLOUD SECURITY LAB", credit: 1, lecture: 0, practical: 2, tutorial: 0, availableOptions: 0 },
  { code: "CSB210", name: "AZURE AI ENGINEER ASSOCIATE", credit: 4, lecture: 3, practical: 2, tutorial: 0, availableOptions: 0 },
  { code: "CSB211", name: "FULL STACK DEVELOPMENT", credit: 4, lecture: 3, practical: 2, tutorial: 0, availableOptions: 0 },
  { code: "CSE239", name: "SOFTWARE ENGINEERING", credit: 3, lecture: 3, practical: 0, tutorial: 0, availableOptions: 0 },
];

interface SubjectSelectorProps {
  category: string;
  onSubjectSelected: (subject: Subject) => void;
}

function getAIRecommendation(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes("hackathon") || cat.includes("co-curricular") || cat.includes("project")) return "CSB211";
  if (cat.includes("nptel") || cat.includes("mooc") || cat.includes("certification")) return "CSB210";
  if (cat.includes("internship") || cat.includes("revenue")) return "CSE239";
  if (cat.includes("community") || cat.includes("social")) return "CSE238";
  if (cat.includes("rpl") || cat.includes("grade")) return "CSB206";
  return "CSB211";
}

const SubjectSelector = ({ category, onSubjectSelected }: SubjectSelectorProps) => {
  const aiRecommendedCode = getAIRecommendation(category);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const handleContinue = () => {
    const code = selectedCode || aiRecommendedCode;
    const subject = semesterSubjects.find(s => s.code === code);
    if (subject) onSubjectSelected(subject);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* AI Recommendation Banner */}
      <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Recommendation</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on your <strong>{category}</strong> achievement, I recommend applying under{" "}
            <strong>{semesterSubjects.find(s => s.code === aiRecommendedCode)?.name}</strong> ({aiRecommendedCode}).
            You can go with this or select a different course below.
          </p>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Select a course to view available options.</h2>
        <p className="mt-1 text-sm italic text-muted-foreground">
          Available Courses for <strong>{category}</strong>
        </p>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {semesterSubjects.map((subject) => {
          const isAIRec = subject.code === aiRecommendedCode;
          const isSelected = selectedCode === subject.code;
          const isActive = isSelected || (!selectedCode && isAIRec);

          return (
            <button
              key={subject.code}
              onClick={() => setSelectedCode(subject.code)}
              className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                isActive
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {/* Tags */}
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {subject.code}
                </span>
                <span className="rounded-full border border-primary/30 bg-background px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  Available Options-{subject.availableOptions}
                </span>
                {isAIRec && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    <Sparkles className="h-3 w-3" /> AI Pick
                  </span>
                )}
              </div>

              {/* Name */}
              <h4 className="text-sm font-bold text-foreground">{subject.name}</h4>

              {/* Credits info */}
              <p className="mt-1 text-xs text-muted-foreground">
                Credit: {subject.credit} &nbsp; L: {subject.lecture} &nbsp; P: {subject.practical} &nbsp; T: {subject.tutorial}
              </p>

              {/* Selection indicator */}
              {isActive && (
                <div className="absolute right-3 top-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleContinue}
          className="flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <BookOpen className="h-4 w-4" />
          Continue with {selectedCode || aiRecommendedCode}
        </button>
        <span className="text-xs text-muted-foreground">
          {selectedCode && selectedCode !== aiRecommendedCode
            ? "You selected a different course"
            : "AI recommended course selected"}
        </span>
      </div>
    </motion.div>
  );
};

export { semesterSubjects };
export default SubjectSelector;
