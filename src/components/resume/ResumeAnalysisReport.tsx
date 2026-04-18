import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star, AlertTriangle, TrendingUp, ShieldCheck, Target,
  CheckCircle, XCircle, Lightbulb, Building2, BarChart3
} from "lucide-react";

type AnalysisData = {
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  extracted_skills: {
    technical: string[];
    soft: string[];
    tools: string[];
  };
  role_fitness: { role: string; fit_pct: number; reason: string }[];
  hr_red_flags: string[];
  improvements: { section: string; issue: string; fix: string }[];
  ats_score: number;
  ats_issues: string[];
  target_companies: { company: string; readiness: string; gaps: string[] }[];
};

const ScoreRing = ({ score, label }: { score: number; label: string }) => {
  const color = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
          <circle
            cx="40" cy="40" r="34" fill="none" strokeWidth="6"
            className={color}
            stroke="currentColor"
            strokeDasharray={`${(score / 100) * 213.6} 213.6`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${color}`}>{score}</span>
      </div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
};

const ResumeAnalysisReport = ({ data }: { data: AnalysisData }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">AI Resume Report</h2>
      </div>

      {/* Scores + Summary */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex gap-4 shrink-0">
              <ScoreRing score={data.overall_score} label="Overall" />
              <ScoreRing score={data.ats_score} label="ATS" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {data.extracted_skills.technical.slice(0, 6).map(s => (
                  <Badge key={s} className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/20">{s}</Badge>
                ))}
                {data.extracted_skills.tools.slice(0, 4).map(s => (
                  <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                ))}
                {data.extracted_skills.soft.slice(0, 3).map(s => (
                  <Badge key={s} className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/20">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Strengths
            </p>
            <ul className="space-y-1.5">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5" /> Weaknesses
            </p>
            <ul className="space-y-1.5">
              {data.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span> {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* HR Red Flags */}
      {data.hr_red_flags?.length > 0 && (
        <Card className="border-red-200 dark:border-red-500/20 shadow-sm bg-red-50/50 dark:bg-red-500/5">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> HR Red Flags
            </p>
            <div className="flex flex-wrap gap-2">
              {data.hr_red_flags.map((f, i) => (
                <Badge key={i} variant="outline" className="text-[10px] text-red-600 border-red-200 dark:border-red-500/20">{f}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvements */}
      {data.improvements?.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" /> How to Improve
            </p>
            <div className="space-y-3">
              {data.improvements.map((imp, i) => (
                <div key={i} className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs font-bold text-foreground">{imp.section}</p>
                  <p className="text-[11px] text-red-500 mt-0.5">Issue: {imp.issue}</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Fix: {imp.fix}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Fitness */}
      {data.role_fitness?.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Role Fitness
            </p>
            <div className="space-y-2.5">
              {data.role_fitness.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-semibold text-foreground truncate">{r.role}</p>
                      <span className="text-xs font-bold text-foreground shrink-0">{r.fit_pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${r.fit_pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-full rounded-full ${r.fit_pct >= 75 ? "bg-emerald-500" : r.fit_pct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Target Companies */}
      {data.target_companies?.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Company Readiness
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.target_companies.map((tc, i) => {
                const readyColor = tc.readiness === "high" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" :
                  tc.readiness === "medium" ? "text-amber-600 bg-amber-50 dark:bg-amber-500/10" :
                    "text-red-500 bg-red-50 dark:bg-red-500/10";
                return (
                  <div key={i} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold">{tc.company}</p>
                      <Badge className={`text-[10px] ${readyColor} border-0 uppercase`}>{tc.readiness}</Badge>
                    </div>
                    <ul className="space-y-1">
                      {tc.gaps.map((g, j) => (
                        <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5 shrink-0">→</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ATS Issues */}
      {data.ats_issues?.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> ATS Compatibility Issues
            </p>
            <ul className="space-y-1.5">
              {data.ats_issues.map((issue, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" /> {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResumeAnalysisReport;
