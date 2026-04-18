import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Mic, X, Sparkles } from "lucide-react";

interface MockInterviewSetupProps {
  onStart: (config: MockInterviewConfig) => void;
  onCancel: () => void;
}

export interface MockInterviewConfig {
  company: string;
  role: string;
  difficulty: string;
  questionCount: string;
  interviewType: string;
}

const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "TCS", "Infosys", "Wipro",
  "Cognizant", "HCL", "Accenture", "Deloitte", "Goldman Sachs", "JP Morgan",
  "Adobe", "Salesforce", "Flipkart", "Paytm", "Zomato", "Swiggy",
];

const ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Analyst", "Data Scientist", "ML Engineer", "DevOps Engineer",
  "Product Manager", "Business Analyst", "QA Engineer", "Cloud Engineer",
];

const MockInterviewSetup = ({ onStart, onCancel }: MockInterviewSetupProps) => {
  const [company, setCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState("5");
  const [interviewType, setInterviewType] = useState("mixed");

  const finalCompany = company === "other" ? customCompany : company;
  const finalRole = role === "other" ? customRole : role;
  const canStart = finalCompany.trim() && finalRole.trim();

  return (
    <Card className="p-5 border-primary/20 bg-card animate-fade-in max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
            <Mic className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="font-semibold text-foreground">Mock Interview Setup</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Target Company</Label>
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select company..." />
            </SelectTrigger>
            <SelectContent>
              {COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              <SelectItem value="other">Other (type below)</SelectItem>
            </SelectContent>
          </Select>
          {company === "other" && (
            <Input
              className="mt-1.5 h-9 text-sm"
              placeholder="Enter company name..."
              value={customCompany}
              onChange={e => setCustomCompany(e.target.value)}
            />
          )}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select role..." />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              <SelectItem value="other">Other (type below)</SelectItem>
            </SelectContent>
          </Select>
          {role === "other" && (
            <Input
              className="mt-1.5 h-9 text-sm"
              placeholder="Enter role..."
              value={customRole}
              onChange={e => setCustomRole(e.target.value)}
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Questions</Label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="7">7</SelectItem>
                <SelectItem value="10">10</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Type</Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button
        className="w-full mt-4 gap-2 gradient-primary"
        disabled={!canStart}
        onClick={() => onStart({ company: finalCompany, role: finalRole, difficulty, questionCount, interviewType })}
      >
        <Sparkles className="h-4 w-4" /> Start Interview
      </Button>
    </Card>
  );
};

export default MockInterviewSetup;
