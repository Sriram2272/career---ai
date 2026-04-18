import { useState, useRef, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import InterviewHistory from "@/components/dashboard/shared/InterviewHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Video, VideoOff, Mic, Play, Square, 
  Camera, Loader2, CheckCircle2, XCircle, Star, Volume2,
  Sparkles, Timer, ArrowRight, RotateCcw, Trophy, Code2, Clock,
  BarChart3, Target, Brain, MessageSquare, Zap
} from "lucide-react";

type Phase = "setup" | "preparing" | "question" | "recording" | "evaluating" | "feedback" | "report";

interface QuestionData {
  question: string;
  type: string;
  expectedTopics: string[];
  difficulty: string;
  timeLimit?: number;
}

interface EvalData {
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  verdict: string;
  // coding-specific
  codeQuality?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  partialCreditNotes?: string;
  isPseudocode?: boolean;
  approachCorrect?: boolean;
}

interface ReportData {
  overallScore: number;
  grade: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  hireRecommendation: string;
  tips: string[];
  categoryScores?: Record<string, number>;
  detailedFeedback?: Array<{
    questionIndex: number;
    question: string;
    score: number;
    verdict: string;
    keyTakeaway: string;
  }>;
}

const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "TCS", "Infosys", "Wipro",
  "Cognizant", "HCL", "Accenture", "Deloitte", "Goldman Sachs", "JP Morgan",
  "Adobe", "Salesforce", "Flipkart", "Paytm",
];
const ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Analyst", "Data Scientist", "ML Engineer", "DevOps Engineer", "Product Manager",
];

const MOCK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mock-interview`;

const VideoInterview = () => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Setup
  const [company, setCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState("5");

  // Interview state
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [codeAnswer, setCodeAnswer] = useState("");
  const [evaluations, setEvaluations] = useState<EvalData[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordedVideos, setRecordedVideos] = useState<string[]>([]);
  const [answerTab, setAnswerTab] = useState<"speak" | "code">("speak");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const finalCompany = company === "other" ? customCompany : company;
  const currentQuestion = questions[currentQ];
  const isCodingQuestion = currentQuestion?.type === "coding";

  // Camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOn(true);
    } catch {
      toast.error("Camera access denied. Please allow camera and microphone.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
  }, []);

  // TTS
  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) ||
                        voices.find(v => v.lang.startsWith("en-"));
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // STT
  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalTranscript = "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + " ";
        else interim += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript + interim);
    };
    recognition.onerror = () => {};
    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  // Video recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedVideos(prev => [...prev, URL.createObjectURL(blob)]);
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  // Timer
  const startTimer = useCallback((seconds: number) => {
    setTimeLeft(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Auto-submit when timer ends
  useEffect(() => {
    if (timeLeft === 0 && phase === "recording") handleSubmitAnswer();
  }, [timeLeft, phase]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopRecognition();
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // API
  const callAI = async (aiPhase: string, messages: any[], config?: any) => {
    const resp = await fetch(MOCK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ phase: aiPhase, messages, config }),
    });
    if (!resp.ok) {
      if (resp.status === 429) { toast.error("Rate limited. Try again shortly."); throw new Error("429"); }
      if (resp.status === 402) { toast.error("AI credits exhausted."); throw new Error("402"); }
      throw new Error("AI error");
    }
    return (await resp.json()).result;
  };

  // Start interview
  const handleStart = async () => {
    if (!finalCompany || !role) { toast.error("Select company and role"); return; }
    setPhase("preparing");
    await startCamera();
    try {
      const result = await callAI("generate_questions", [
        { role: "user", content: `Generate interview questions for ${finalCompany}, role: ${role}` }
      ], { questionCount: parseInt(questionCount), difficulty, domain: "mixed", jobType: role });
      if (Array.isArray(result)) {
        setQuestions(result);
        setCurrentQ(0);
        setEvaluations([]);
        setRecordedVideos([]);
        setTimeout(() => presentQuestion(result, 0), 1000);
      } else {
        toast.error("Failed to generate questions."); setPhase("setup");
      }
    } catch {
      toast.error("Failed to start interview."); setPhase("setup");
    }
  };

  // Present question
  const presentQuestion = async (qs: QuestionData[], idx: number) => {
    setPhase("question");
    const q = qs[idx];
    const isCoding = q.type === "coding";
    setAnswerTab(isCoding ? "code" : "speak");
    setCodeAnswer("");
    await speakText(`Question ${idx + 1}. ${q.question}`);
    setPhase("recording");
    setTranscript("");
    startRecording();
    if (!isCoding) startRecognition();
    const time = q.timeLimit || (isCoding ? 300 : (difficulty === "easy" ? 120 : difficulty === "hard" ? 180 : 150));
    startTimer(time);
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (phase !== "recording") return;
    stopRecording();
    stopRecognition();
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("evaluating");

    const isCoding = questions[currentQ]?.type === "coding";
    const answer = isCoding
      ? (codeAnswer.trim() || "No code provided.")
      : (transcript.trim() || "No answer provided.");

    const evalPhase = isCoding ? "evaluate_code" : "evaluate_answer";
    const prompt = isCoding
      ? `Question: ${questions[currentQ].question}\n\nExpected topics: ${questions[currentQ].expectedTopics.join(", ")}\n\nCandidate's code/pseudocode:\n\`\`\`\n${answer}\n\`\`\`\n\nEvaluate with partial marking. If it's pseudocode, still give credit for correct logic.`
      : `Question: ${questions[currentQ].question}\n\nExpected topics: ${questions[currentQ].expectedTopics.join(", ")}\n\nCandidate's answer: ${answer}`;

    try {
      const result = await callAI(evalPhase, [{ role: "user", content: prompt }]);
      setEvaluations(prev => [...prev, result as EvalData]);
      setPhase("feedback");
    } catch {
      toast.error("Failed to evaluate. Moving on.");
      setEvaluations(prev => [...prev, { score: 0, strengths: [], improvements: ["Evaluation failed"], modelAnswer: "", verdict: "Poor" }]);
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1);
        presentQuestion(questions, currentQ + 1);
      } else {
        generateReport();
      }
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      const next = currentQ + 1;
      setCurrentQ(next);
      setTranscript("");
      setCodeAnswer("");
      presentQuestion(questions, next);
    } else {
      generateReport();
    }
  };

  // Generate report
  const generateReport = async () => {
    setPhase("evaluating");
    try {
      const qaPairs = questions.map((q, i) => ({
        question: q.question,
        type: q.type,
        answer: evaluations[i]
          ? `Score: ${evaluations[i].score}/10, Verdict: ${evaluations[i].verdict}${evaluations[i].codeQuality ? `, Code Quality: ${evaluations[i].codeQuality}` : ""}${evaluations[i].partialCreditNotes ? `, Partial Credit: ${evaluations[i].partialCreditNotes}` : ""}`
          : "Skipped",
        strengths: evaluations[i]?.strengths || [],
        improvements: evaluations[i]?.improvements || [],
      }));

      const result = await callAI("final_report", [
        { role: "user", content: `Generate a detailed final report for this mock interview at ${finalCompany} for ${role} role:\n\n${JSON.stringify(qaPairs, null, 2)}` }
      ]);

      const reportData = result as ReportData;
      setReport(reportData);
      setPhase("report");
      stopCamera();

      if (user?.id) {
        await supabase.from("mock_interviews").insert({
          student_id: user.id,
          domain: finalCompany,
          difficulty,
          job_type: role,
          questions: questions as any,
          responses: evaluations as any,
          ai_feedback: result as any,
          overall_score: reportData.overallScore,
          duration_seconds: parseInt(questionCount) * 150,
        });
      }
    } catch {
      toast.error("Failed to generate report.");
      // Still show report phase with whatever data we have
      setReport({
        overallScore: Math.round(evaluations.reduce((a, e) => a + e.score, 0) / Math.max(evaluations.length, 1) * 10),
        grade: "N/A",
        summary: "Report generation failed. Showing available scores.",
        strengths: [],
        weaknesses: [],
        hireRecommendation: "N/A",
        tips: ["Try again for a full report."],
      });
      setPhase("report");
      stopCamera();
    }
  };

  const resetInterview = () => {
    setPhase("setup");
    setQuestions([]);
    setCurrentQ(0);
    setEvaluations([]);
    setReport(null);
    setTranscript("");
    setCodeAnswer("");
    setRecordedVideos([]);
    setExpandedQ(null);
    stopCamera();
    window.speechSynthesis?.cancel();
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-500";
    if (grade.startsWith("B")) return "text-blue-500";
    if (grade.startsWith("C")) return "text-amber-500";
    return "text-red-500";
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === "Excellent") return "bg-green-500/10 text-green-500 border-green-500/20";
    if (verdict === "Good") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (verdict === "Average") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getCategoryIcon = (cat: string) => {
    const map: Record<string, any> = {
      technical: Brain, communication: MessageSquare, problemSolving: Target,
      coding: Code2, behavioral: Star,
    };
    const Icon = map[cat] || BarChart3;
    return <Icon className="h-3.5 w-3.5" />;
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <Video className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Video Mock Interview</h1>
              <p className="text-xs text-muted-foreground">AI interviewer speaks • You record video answers • Code editor for coding rounds</p>
            </div>
          </div>
          {phase !== "setup" && (
            <Button variant="ghost" size="sm" onClick={resetInterview} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>

        {/* SETUP PHASE */}
        {phase === "setup" && (
          <div className="space-y-5">
            {/* Interview History Dashboard - Stats & History on top */}
            <InterviewHistory />

            {/* Setup Form + How It Works below */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 space-y-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Interview Setup
                </h2>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Target Company</Label>
                  <Select value={company} onValueChange={setCompany}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select company..." /></SelectTrigger>
                    <SelectContent>
                      {COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {company === "other" && (
                    <Input className="mt-1.5 h-9 text-sm" placeholder="Company name..." value={customCompany} onChange={e => setCustomCompany(e.target.value)} />
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select role..." /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full gradient-primary gap-2" onClick={handleStart} disabled={!finalCompany || !role}>
                  <Play className="h-4 w-4" /> Start Video Interview
                </Button>
              </Card>

              <Card className="p-5 space-y-3">
                <h2 className="font-semibold text-foreground">How It Works</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {[
                    { icon: Volume2, title: "AI speaks the question", desc: "Listen carefully as the AI interviewer reads each question aloud" },
                    { icon: Camera, title: "Record your answer", desc: "Webcam records while speech recognition captures your words" },
                    { icon: Code2, title: "Code editor for coding rounds", desc: "Write code or pseudocode — partial credit for correct approach" },
                    { icon: Trophy, title: "Detailed report card", desc: "Per-question breakdown, category scores, and hire recommendation" },
                  ].map(({ icon: Icon, title, desc }, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p><span className="text-foreground font-medium">{title}</span> — {desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                  ⚡ Best in Chrome. Allow camera & mic when prompted. Pseudocode gets partial marks!
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* INTERVIEW PHASES */}
        {phase !== "setup" && phase !== "report" && (
          <div className="grid md:grid-cols-5 gap-4">
            {/* Left - Video + Code Editor */}
            <div className="md:col-span-3 space-y-3">
              <Card className="overflow-hidden bg-black relative aspect-video">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <VideoOff className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {phase === "recording" && (
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded">REC</span>
                  </div>
                )}
                {phase === "recording" && (
                  <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${timeLeft <= 30 ? "bg-red-500/80" : "bg-black/50"} text-white text-sm font-mono`}>
                    <Timer className="h-3.5 w-3.5" />
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                  </div>
                )}
                {isSpeaking && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full">
                    <Volume2 className="h-4 w-4 animate-pulse" />
                    <span className="text-sm font-medium">AI is speaking...</span>
                  </div>
                )}
                {(phase === "preparing" || phase === "evaluating") && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center text-white space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="text-sm font-medium">{phase === "preparing" ? "Preparing your interview..." : "AI is evaluating..."}</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Code Editor / Transcript area */}
              {(phase === "recording" || phase === "evaluating") && (
                <Card className="p-3">
                  {isCodingQuestion ? (
                    <Tabs value={answerTab} onValueChange={(v) => setAnswerTab(v as "speak" | "code")}>
                      <div className="flex items-center justify-between mb-2">
                        <TabsList className="h-7">
                          <TabsTrigger value="code" className="text-xs gap-1 h-6 px-2"><Code2 className="h-3 w-3" /> Code</TabsTrigger>
                          <TabsTrigger value="speak" className="text-xs gap-1 h-6 px-2"><Mic className="h-3 w-3" /> Speak</TabsTrigger>
                        </TabsList>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Clock className="h-2.5 w-2.5" /> {currentQuestion?.timeLimit ? `${Math.floor(currentQuestion.timeLimit / 60)}min` : "5min"} limit
                        </Badge>
                      </div>
                      <TabsContent value="code" className="mt-0">
                        <textarea
                          className="w-full h-48 bg-[hsl(var(--muted))] text-foreground font-mono text-sm p-3 rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="Write your code or pseudocode here...&#10;&#10;// Pseudocode is accepted and will receive partial marks!&#10;// e.g. function findMax(arr):&#10;//   max = arr[0]&#10;//   for each element in arr:&#10;//     if element > max: max = element&#10;//   return max"
                          value={codeAnswer}
                          onChange={(e) => setCodeAnswer(e.target.value)}
                          spellCheck={false}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">💡 Pseudocode accepted — partial credit for correct approach & logic</p>
                      </TabsContent>
                      <TabsContent value="speak" className="mt-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Mic className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-xs font-medium text-muted-foreground">Live Transcript</span>
                        </div>
                        <p className="text-sm text-foreground min-h-[40px]">
                          {transcript || <span className="text-muted-foreground italic">Start speaking to explain your approach...</span>}
                        </p>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Mic className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs font-medium text-muted-foreground">Live Transcript</span>
                      </div>
                      <p className="text-sm text-foreground min-h-[40px]">
                        {transcript || <span className="text-muted-foreground italic">Start speaking...</span>}
                      </p>
                    </>
                  )}
                </Card>
              )}
            </div>

            {/* Right Panel */}
            <div className="md:col-span-2 space-y-3">
              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Progress</span>
                  <span className="text-xs font-bold text-foreground">{currentQ + 1}/{questions.length}</span>
                </div>
                <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1.5" />
              </Card>

              {currentQuestion && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">Q{currentQ + 1}</Badge>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-xs capitalize">{currentQuestion.type}</Badge>
                      {isCodingQuestion && <Badge className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20 border">Coding</Badge>}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">{currentQuestion.question}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {currentQuestion.expectedTopics.map(t => (
                      <Badge key={t} variant="outline" className="text-[10px] text-muted-foreground">{t}</Badge>
                    ))}
                  </div>
                </Card>
              )}

              {phase === "recording" && (
                <Button className="w-full gap-2" variant="destructive" onClick={handleSubmitAnswer}>
                  <Square className="h-4 w-4" /> Submit Answer
                </Button>
              )}

              {/* Feedback */}
              {phase === "feedback" && evaluations[currentQ] && (
                <Card className="p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Feedback</h3>
                    <Badge className={`${getVerdictColor(evaluations[currentQ].verdict)} border`}>
                      {evaluations[currentQ].verdict} ({evaluations[currentQ].score}/10)
                    </Badge>
                  </div>

                  {/* Coding-specific feedback */}
                  {evaluations[currentQ].codeQuality && (
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="text-center p-1.5 rounded bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">Quality</p>
                        <p className="text-xs font-bold text-foreground">{evaluations[currentQ].codeQuality}</p>
                      </div>
                      <div className="text-center p-1.5 rounded bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">Time</p>
                        <p className="text-xs font-bold text-foreground">{evaluations[currentQ].timeComplexity}</p>
                      </div>
                      <div className="text-center p-1.5 rounded bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">Space</p>
                        <p className="text-xs font-bold text-foreground">{evaluations[currentQ].spaceComplexity}</p>
                      </div>
                    </div>
                  )}

                  {evaluations[currentQ].partialCreditNotes && (
                    <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                      <p className="text-[10px] font-medium text-blue-500 mb-0.5">Partial Credit</p>
                      <p className="text-xs text-blue-400">{evaluations[currentQ].partialCreditNotes}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-green-500 mb-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Strengths</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {evaluations[currentQ].strengths.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-500 mb-1 flex items-center gap-1"><XCircle className="h-3 w-3" /> To Improve</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {evaluations[currentQ].improvements.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-500 mb-1">Model Answer</p>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-2 rounded">{evaluations[currentQ].modelAnswer}</pre>
                  </div>

                  <Button className="w-full gap-2 gradient-primary" onClick={handleNext}>
                    {currentQ < questions.length - 1 ? (
                      <><ArrowRight className="h-4 w-4" /> Next Question</>
                    ) : (
                      <><Trophy className="h-4 w-4" /> View Report</>
                    )}
                  </Button>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* REPORT PHASE */}
        {phase === "report" && report && (
          <div className="space-y-4 animate-fade-in">
            {/* Hero Score */}
            <Card className="p-6 text-center">
              <Trophy className="h-12 w-12 mx-auto text-primary mb-3" />
              <div className={`text-5xl font-black ${getGradeColor(report.grade)}`}>{report.grade}</div>
              <div className="text-2xl font-bold text-foreground mt-1">{report.overallScore}/100</div>
              <Badge className="mt-2" variant="secondary">{report.hireRecommendation}</Badge>
              <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">{report.summary}</p>
            </Card>

            {/* Category Scores */}
            {report.categoryScores && Object.keys(report.categoryScores).length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-primary" /> Category Scores
                </h3>
                <div className="space-y-2.5">
                  {Object.entries(report.categoryScores).map(([cat, score]) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                          {getCategoryIcon(cat)}
                          {cat.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <span className="text-xs font-bold text-foreground">{score}/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${getScoreBarColor(score)}`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Strengths / Weaknesses / Tips */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-green-500 mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Strengths</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {report.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-1.5"><XCircle className="h-4 w-4" /> Weaknesses</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {report.weaknesses.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-blue-500 mb-2 flex items-center gap-1.5"><Zap className="h-4 w-4" /> Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {report.tips.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </Card>
            </div>

            {/* Detailed Per-Question Breakdown */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Detailed Question-by-Question Breakdown</h3>
              <div className="space-y-2">
                {questions.map((q, i) => {
                  const ev = evaluations[i];
                  const isExpanded = expandedQ === i;
                  return (
                    <div key={i} className="rounded-lg border bg-card overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedQ(isExpanded ? null : i)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="text-[10px] shrink-0">Q{i + 1}</Badge>
                          <Badge variant="outline" className="text-[10px] capitalize shrink-0">{q.type}</Badge>
                          <span className="text-xs text-foreground truncate">{q.question}</span>
                        </div>
                        {ev && (
                          <Badge className={`ml-2 shrink-0 ${getVerdictColor(ev.verdict)} border text-xs`}>
                            {ev.score}/10
                          </Badge>
                        )}
                      </button>
                      {isExpanded && ev && (
                        <div className="px-3 pb-3 space-y-2 border-t bg-muted/10">
                          <div className="pt-2">
                            <p className="text-xs text-foreground font-medium mb-1">Question:</p>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{q.question}</p>
                          </div>

                          {ev.codeQuality && (
                            <div className="grid grid-cols-3 gap-1.5">
                              <div className="text-center p-1.5 rounded bg-muted/50">
                                <p className="text-[10px] text-muted-foreground">Quality</p>
                                <p className="text-xs font-bold">{ev.codeQuality}</p>
                              </div>
                              <div className="text-center p-1.5 rounded bg-muted/50">
                                <p className="text-[10px] text-muted-foreground">Time</p>
                                <p className="text-xs font-bold">{ev.timeComplexity}</p>
                              </div>
                              <div className="text-center p-1.5 rounded bg-muted/50">
                                <p className="text-[10px] text-muted-foreground">Space</p>
                                <p className="text-xs font-bold">{ev.spaceComplexity}</p>
                              </div>
                            </div>
                          )}

                          {ev.partialCreditNotes && (
                            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                              <p className="text-[10px] font-medium text-blue-500">Partial Credit Notes</p>
                              <p className="text-xs text-blue-400">{ev.partialCreditNotes}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] font-medium text-green-500 mb-0.5">Strengths</p>
                              <ul className="text-[11px] text-muted-foreground space-y-0.5">
                                {ev.strengths.map((s, j) => <li key={j}>• {s}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-amber-500 mb-0.5">To Improve</p>
                              <ul className="text-[11px] text-muted-foreground space-y-0.5">
                                {ev.improvements.map((s, j) => <li key={j}>• {s}</li>)}
                              </ul>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-medium text-blue-500 mb-0.5">Model Answer</p>
                            <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-2 rounded">{ev.modelAnswer}</pre>
                          </div>

                          {/* Show detailed feedback from report */}
                          {report?.detailedFeedback?.[i]?.keyTakeaway && (
                            <div className="p-2 rounded bg-primary/5 border border-primary/10">
                              <p className="text-[10px] font-medium text-primary">Key Takeaway</p>
                              <p className="text-xs text-muted-foreground">{report.detailedFeedback[i].keyTakeaway}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="flex gap-2">
              <Button className="flex-1 gradient-primary gap-2" onClick={resetInterview}>
                <RotateCcw className="h-4 w-4" /> Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VideoInterview;
