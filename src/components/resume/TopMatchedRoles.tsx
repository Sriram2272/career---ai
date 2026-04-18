import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, MapPin, IndianRupee, CheckCircle, Target, Briefcase
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Job = {
  id: string;
  title: string;
  description: string | null;
  skills_required: string[] | null;
  min_cgpa: number | null;
  eligible_branches: string[] | null;
  job_type: string | null;
  package_lpa: number | null;
  deadline: string | null;
  status: string | null;
  companies: { name: string; logo_url: string | null; locations: string[] | null; industry: string | null } | null;
};

type Props = {
  jobs: Job[];
  profile: any;
  appliedIds: Set<string> | undefined;
  extractedSkills?: { technical: string[]; soft: string[]; tools: string[] } | null;
};

const TopMatchedRoles = ({ jobs, profile, appliedIds, extractedSkills }: Props) => {
  const navigate = useNavigate();

  const getMatchScore = (job: Job) => {
    if (!profile) return 0;
    let score = 0, total = 0;

    // Use AI-extracted skills if available, otherwise profile skills
    const aiSkills = extractedSkills
      ? [...(extractedSkills.technical || []), ...(extractedSkills.tools || [])].map(s => s.toLowerCase())
      : [];
    const profileSkills = ((profile.skills as string[] | null) || []).map(s => s.toLowerCase());
    const mySkills = aiSkills.length > 0 ? aiSkills : profileSkills;

    const required = (job.skills_required || []).map(s => s.toLowerCase());
    if (required.length > 0) {
      const matched = required.filter(s => mySkills.some(ms => ms.includes(s) || s.includes(ms))).length;
      score += (matched / required.length) * 50;
      total += 50;
    }
    if (job.min_cgpa && profile.cgpa) {
      score += (profile.cgpa as number) >= job.min_cgpa ? 25 : ((profile.cgpa as number) / job.min_cgpa) * 20;
      total += 25;
    }
    if (job.eligible_branches?.length && profile.branch) {
      score += job.eligible_branches.includes(profile.branch) ? 25 : 0;
      total += 25;
    }
    return total > 0 ? Math.round((score / total) * 100) : 50;
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return { text: "HIGH MATCH", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/20" };
    if (score >= 60) return { text: "MEDIUM", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/20" };
    return { text: "LOW", color: "text-red-500 bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/20" };
  };

  const getMatchBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-400";
  };

  const topMatched = useMemo(() => {
    if (!jobs || !profile) return [];
    return [...jobs]
      .map(j => ({ ...j, match: getMatchScore(j) }))
      .sort((a, b) => b.match - a.match)
      .slice(0, 8);
  }, [jobs, profile, extractedSkills]);

  const highMatches = topMatched.filter(j => j.match >= 80).length;

  if (topMatched.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Top Matched Roles
        </h2>
        <span className="text-xs text-muted-foreground">
          {highMatches} high match{highMatches !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="space-y-2.5">
        {topMatched.map((job, i) => {
          const matchLabel = getMatchLabel(job.match);
          const applied = appliedIds?.has(job.id);
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {job.companies?.logo_url ? (
                      <img src={job.companies.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{job.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${matchLabel.color}`}>
                        {matchLabel.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>{job.companies?.name}</span>
                      {job.companies?.locations?.[0] && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{job.companies.locations[0]}</span>
                        </>
                      )}
                      {job.package_lpa && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />₹{job.package_lpa} LPA</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold">{job.match}%</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Fit</p>
                    </div>
                    <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${job.match}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-full rounded-full ${getMatchBarColor(job.match)}`}
                      />
                    </div>
                  </div>
                  {applied ? (
                    <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:border-emerald-500/20 text-[10px] shrink-0">
                      <CheckCircle className="h-3 w-3 mr-1" /> Applied
                    </Badge>
                  ) : (
                    <Button size="sm" className="gradient-primary text-primary-foreground rounded-xl text-xs shrink-0"
                      onClick={() => navigate("/jobs")}>
                      Apply
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TopMatchedRoles;
