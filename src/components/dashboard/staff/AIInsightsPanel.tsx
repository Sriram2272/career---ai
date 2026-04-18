import { Sparkles, ArrowRight, Briefcase, TrendingUp, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const suggestions = [
  {
    icon: Briefcase,
    title: "Complete Your Profile",
    desc: "Add skills, CGPA, and upload your resume to get better job matches.",
    gradient: "from-primary to-primary-glow",
  },
  {
    icon: TrendingUp,
    title: "Practice Mock Interviews",
    desc: "AI-powered interview prep tailored to your target companies.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BookOpen,
    title: "Skill Gap Analysis",
    desc: "See which skills you need to improve for top placements.",
    gradient: "from-violet-500 to-purple-500",
  },
];

const AIInsightsPanel = () => {
  return (
    <motion.div
      id="ai-insights"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl card-border bg-card p-6 card-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Career Suggestions</h3>
          <p className="text-xs text-muted-foreground">Personalized placement recommendations</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {suggestions.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
            className="group cursor-pointer rounded-xl bg-background p-4 transition-all duration-300 hover:bg-secondary/50 hover:shadow-md hover:-translate-y-1 relative overflow-hidden"
          >
            <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${s.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <s.icon className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5">
              Explore <ArrowRight className="h-3 w-3" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AIInsightsPanel;