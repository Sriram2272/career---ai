import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Target, CheckCircle, XCircle, AlertTriangle,
  Lightbulb, ArrowRight, ShieldAlert, BookOpen
} from "lucide-react";

type JDMatchData = {
  match_score: number;
  verdict: string;
  summary: string;
  matched_skills: string[];
  missing_skills: string[];
  partial_skills: { skill: string; has: string; needs: string }[];
  experience_gap: string;
  education_match: boolean;
  culture_fit_signals: string[];
  deal_breakers: string[];
  recommendations: string[];
  interview_prep: string[];
  apply_recommendation: string;
  apply_reason: string;
};

const JDMatchReport = ({ data }: { data: JDMatchData }) => {
  const scoreColor = data.match_score >= 75 ? "text-emerald-500" : data.match_score >= 50 ? "text-amber-500" : "text-red-500";
  const verdictColor = data.verdict?.includes("STRONG") ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" :
    data.verdict?.includes("PARTIAL") ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10" :
      "bg-red-50 text-red-500 dark:bg-red-500/10";
  const applyColor = data.apply_recommendation?.includes("YES") || data.apply_recommendation?.includes("APPLY") ?
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" :
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">JD Match Report</h2>
      </div>

      {/* Score + Verdict */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative h-24 w-24 shrink-0">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="7" className="text-secondary" />
                <circle
                  cx="48" cy="48" r="40" fill="none" strokeWidth="7"
                  className={scoreColor}
                  stroke="currentColor"
                  strokeDasharray={`${(data.match_score / 100) * 251.3} 251.3`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${scoreColor}`}>{data.match_score}%</span>
                <span className="text-[9px] text-muted-foreground uppercase">Match</span>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <Badge className={`${verdictColor} border-0 text-xs mb-2`}>{data.verdict}</Badge>
              <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Match */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Matched Skills ({data.matched_skills?.length || 0})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.matched_skills?.map((s, i) => (
                <Badge key={i} className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5" /> Missing Skills ({data.missing_skills?.length || 0})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.missing_skills?.map((s, i) => (
                <Badge key={i} variant="outline" className="text-[10px] text-red-500 border-red-200 dark:border-red-500/20">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partial Skills */}
      {data.partial_skills?.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Partial Matches</p>
            <div className="space-y-2">
              {data.partial_skills.map((ps, i) => (
                <div key={i} className="bg-secondary/50 rounded-lg p-2.5 flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">{ps.skill}</p>
                    <p className="text-[10px] text-muted-foreground">You have: {ps.has} → Need: {ps.needs}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deal Breakers */}
      {data.deal_breakers?.length > 0 && (
        <Card className="border-red-200 dark:border-red-500/20 shadow-sm bg-red-50/50 dark:bg-red-500/5">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> Deal Breakers
            </p>
            <ul className="space-y-1.5">
              {data.deal_breakers.map((db, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <XCircle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" /> {db}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations + Interview Prep */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.recommendations?.length > 0 && (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Recommendations
              </p>
              <ul className="space-y-1.5">
                {data.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">→</span> {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {data.interview_prep?.length > 0 && (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Interview Prep
              </p>
              <ul className="space-y-1.5">
                {data.interview_prep.map((ip, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">•</span> {ip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Apply Recommendation */}
      <Card className={`${applyColor} border shadow-sm`}>
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">{data.apply_recommendation}</p>
            <p className="text-xs mt-0.5 opacity-80">{data.apply_reason}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JDMatchReport;
