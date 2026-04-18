import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mic, Clock, Brain, Target, ChevronRight, RotateCcw,
  Loader2, Trophy, AlertTriangle, CheckCircle2, XCircle,
  Star, Zap, ArrowRight, Play
} from "lucide-react";

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mock-interview`;

type Question = {
  question: string;
  type: string;
  expectedTopics: string[];
  difficulty: string;
};

type Evaluation = {
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  verdict: string;
};

type FinalReport = {
  overallScore: number;
  grade: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  hireRecommendation: string;
  tips: string[];
};

type Phase = "setup" | "interview" | "evaluating" | "feedback" | "report";

const DOMAINS = [
  "Data Structures & Algorithms", "System Design", "Web Development",
  "Database & SQL", "Operating Systems", "Computer Networks",
  "Machine Learning", "Cloud Computing", "General HR",
];

const JOB_TYPES = [
  "Software Engineer", "Data Analyst", "Product Manager",
  "DevOps Engineer", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "ML Engineer",
];

const callAI = async (body: Record<string, unknown>) => {
  const resp = await fetch(FUNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "AI call failed");
  }
  return resp.json();
};

const MockInterview = () => {
  const { user } = useAuth();
  // Setup
  const [domain, setDomain] = useState("Data Structures & Algorithms");
  const [jobType, setJobType] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState("5");

  // Interview state
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [timerActive, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const startInterview = async () => {
    setLoading(true);
    try {
      const { result } = await callAI({
        messages: [{ role: "user", content: `Generate ${questionCount} questions for a ${difficulty} ${domain} interview for ${jobType} role.` }],
        config: { domain, jobType, difficulty, questionCount: parseInt(questionCount) },
        phase: "generate_questions",
      });
      if (!Array.isArray(result)) throw new Error("Invalid questions format");
      setQuestions(result);
      setCurrentIdx(0);
      setEvaluations([]);
      setReport(null);
      setPhase("interview");
      const perQ = difficulty === "easy" ? 120 : difficulty === "hard" ? 300 : 180;
      setTimeLeft(perQ);
      setTimerActive(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) { toast.error("Please write an answer"); return; }
    setTimerActive(false);
    setPhase("evaluating");
    setLoading(true);
    try {
      const q = questions[currentIdx];
      const { result } = await callAI({
        messages: [{
          role: "user",
          content: `Question: ${q.question}\nType: ${q.type}\nExpected Topics: ${q.expectedTopics.join(", ")}\n\nCandidate Answer: ${answer}\n\nEvaluate this answer.`,
        }],
        phase: "evaluate_answer",
      });
      setEvaluations(prev => [...prev, result as Evaluation]);
      setPhase("feedback");
    } catch (e: any) {
      toast.error(e.message || "Failed to evaluate");
      setPhase("interview");
      setTimerActive(true);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      generateReport();
      return;
    }
    setCurrentIdx(p => p + 1);
    setAnswer("");
    setPhase("interview");
    const perQ = difficulty === "easy" ? 120 : difficulty === "hard" ? 300 : 180;
    setTimeLeft(perQ);
    setTimerActive(true);
  };

  const generateReport = async () => {
    setLoading(true);
    setPhase("report");
    try {
      const qaPairs = questions.map((q, i) => ({
        question: q.question,
        type: q.type,
        evaluation: evaluations[i] || { score: 0, verdict: "Not answered" },
      }));
      const { result } = await callAI({
        messages: [{ role: "user", content: `Generate a final report for this interview:\n${JSON.stringify(qaPairs)}` }],
        phase: "final_report",
      });
      setReport(result as FinalReport);

      // Save to DB
      if (user?.id) {
        const avgScore = evaluations.reduce((a, e) => a + (e.score || 0), 0) / Math.max(evaluations.length, 1);
        await supabase.from("mock_interviews").insert({
          student_id: user.id,
          domain, job_type: jobType, difficulty,
          questions: questions as any,
          responses: evaluations as any,
          ai_feedback: result as any,
          overall_score: Math.round(avgScore * 10),
          duration_seconds: parseInt(questionCount) * (difficulty === "easy" ? 120 : difficulty === "hard" ? 300 : 180),
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setPhase("setup");
    setQuestions([]);
    setCurrentIdx(0);
    setAnswer("");
    setEvaluations([]);
    setReport(null);
    setTimerActive(false);
  };

  const scoreColor = (s: number) => s >= 8 ? "text-green-500" : s >= 6 ? "text-amber-500" : "text-red-500";
  const gradeColor = (g: string) => ["A+", "A"].includes(g) ? "bg-green-500/10 text-green-600" : ["B+", "B"].includes(g) ? "bg-blue-500/10 text-blue-600" : ["C+", "C"].includes(g) ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600";

  // ========== SETUP ==========
  if (phase === "setup") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl gradient-primary shadow-glow">
              <Mic className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Mock Interview</h1>
            <p className="text-sm text-muted-foreground">AI-powered adaptive interviews with real-time scoring</p>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Configure Your Interview</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Domain</label>
                  <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Target Role</label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{JOB_TYPES.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy (2 min/q)</SelectItem>
                      <SelectItem value="medium">Medium (3 min/q)</SelectItem>
                      <SelectItem value="hard">Hard (5 min/q)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Questions</label>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="8">8 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={startInterview} disabled={loading} className="w-full gap-2 gradient-primary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {loading ? "Generating Questions..." : "Start Interview"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== INTERVIEW / EVALUATING ==========
  if (phase === "interview" || phase === "evaluating") {
    const q = questions[currentIdx];
    const progress = ((currentIdx) / questions.length) * 100;
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-4 space-y-4">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <div className="flex items-center gap-2">
              <Clock className={`h-3.5 w-3.5 ${timeLeft <= 30 ? "text-red-500 animate-pulse" : ""}`} />
              <span className={timeLeft <= 30 ? "text-red-500 font-bold" : ""}>{formatTime(timeLeft)}</span>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />

          {/* Question Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  Q{currentIdx + 1}
                </div>
                <div className="space-y-2">
                  <p className="text-base font-medium text-foreground leading-relaxed">{q.question}</p>
                  <div className="flex gap-1.5">
                    <Badge variant="outline" className="text-xs capitalize">{q.type}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{q.difficulty}</Badge>
                  </div>
                </div>
              </div>

              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here... Be detailed and structured."
                className="min-h-[180px] text-sm"
                disabled={phase === "evaluating"}
              />

              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">{answer.length} characters</p>
                <div className="flex gap-2">
                  {currentIdx + 1 < questions.length && (
                    <Button variant="ghost" size="sm" onClick={() => { setEvaluations(p => [...p, { score: 0, strengths: [], improvements: ["Skipped"], modelAnswer: "", verdict: "Skipped" }]); nextQuestion(); }}>
                      Skip
                    </Button>
                  )}
                  <Button onClick={submitAnswer} disabled={loading || !answer.trim()} className="gap-1.5 gradient-primary">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {loading ? "Evaluating..." : "Submit Answer"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== FEEDBACK ==========
  if (phase === "feedback") {
    const ev = evaluations[evaluations.length - 1];
    const q = questions[currentIdx];
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-4 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Feedback — Q{currentIdx + 1}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${scoreColor(ev.score)}`}>{ev.score}</span>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>
              </div>

              <Badge className={ev.verdict === "Excellent" || ev.verdict === "Good" ? "bg-green-500/10 text-green-600" : ev.verdict === "Average" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"}>
                {ev.verdict}
              </Badge>

              {ev.strengths?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Strengths</p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-5 list-disc">
                    {ev.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {ev.improvements?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Improve</p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-5 list-disc">
                    {ev.improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {ev.modelAnswer && (
                <div className="space-y-1.5 bg-muted/30 rounded-lg p-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1"><Star className="h-3.5 w-3.5 text-primary" /> Model Answer</p>
                  <p className="text-sm text-muted-foreground">{ev.modelAnswer}</p>
                </div>
              )}

              <Button onClick={nextQuestion} className="w-full gap-2 gradient-primary">
                {currentIdx + 1 >= questions.length ? (
                  <><Trophy className="h-4 w-4" /> View Final Report</>
                ) : (
                  <><ChevronRight className="h-4 w-4" /> Next Question ({currentIdx + 2}/{questions.length})</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== FINAL REPORT ==========
  if (phase === "report") {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-4 space-y-4">
          {loading || !report ? (
            <Card className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Generating your interview report card...</p>
            </Card>
          ) : (
            <>
              {/* Score Header */}
              <Card className="overflow-hidden">
                <div className="gradient-primary p-6 text-center text-primary-foreground">
                  <Trophy className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-5xl font-bold">{report.overallScore}</p>
                  <p className="text-sm opacity-80">out of 100</p>
                </div>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <Badge className={`text-lg px-3 py-1 ${gradeColor(report.grade)}`}>{report.grade}</Badge>
                    <Badge variant="outline" className="text-sm">{report.hireRecommendation}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">{report.summary}</p>
                </CardContent>
              </Card>

              {/* Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Strengths</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {report.strengths?.map((s, i) => <li key={i} className="flex gap-2"><Zap className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />{s}</li>)}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-red-500 flex items-center gap-1.5"><XCircle className="h-4 w-4" /> Weaknesses</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {report.weaknesses?.map((s, i) => <li key={i} className="flex gap-2"><AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />{s}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Tips */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Brain className="h-4 w-4 text-primary" /> Actionable Tips</CardTitle></CardHeader>
                <CardContent>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-4">
                    {report.tips?.map((t, i) => <li key={i}>{t}</li>)}
                  </ol>
                </CardContent>
              </Card>

              {/* Question-wise scores */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Question-wise Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {questions.map((q, i) => {
                      const ev = evaluations[i];
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="text-xs text-muted-foreground w-6">Q{i + 1}</span>
                          <div className="flex-1 truncate text-foreground">{q.question}</div>
                          <span className={`font-bold ${scoreColor(ev?.score || 0)}`}>{ev?.score || 0}/10</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Button onClick={resetAll} className="w-full gap-2" variant="outline">
                <RotateCcw className="h-4 w-4" /> Start New Interview
              </Button>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return null;
};

export default MockInterview;
