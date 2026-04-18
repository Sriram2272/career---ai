import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle, Edit3, Loader2, AlertCircle } from "lucide-react";

export type Benefit = {
  name: string;
  confidence: number;
  criteria: string;
};

interface BenefitsAnalysisProps {
  category: string;
  achievementTitle: string;
  formData: Record<string, string>;
  onComplete: (data: {
    aiRecommendedBenefits: string[];
    selectedBenefits: string[];
    aiAnalysis: string;
    usedAiRecommendation: boolean;
  }) => void;
}

const ALL_BENEFITS = [
  "CCA Credits",
  "Extra Academic Credits",
  "Project Recognition",
  "Grade Upgradation",
  "Merit Certificate",
  "Scholarship Eligibility",
  "CA Exam Exemption",
  "Attendance Benefit",
  "Duty Leave",
];

const BenefitsAnalysis = ({ category, achievementTitle, formData, onComplete }: BenefitsAnalysisProps) => {
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiRecommendedBenefits, setAiRecommendedBenefits] = useState<string[]>([]);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [mode, setMode] = useState<"ai" | "custom">("ai");
  const analysisRef = useRef<HTMLDivElement>(null);
  const streamedRef = useRef("");

  useEffect(() => {
    streamAnalysis();
  }, []);

  // Auto-scroll the analysis panel as content streams in
  useEffect(() => {
    if (analysisRef.current) {
      analysisRef.current.scrollTop = analysisRef.current.scrollHeight;
    }
  }, [aiAnalysis]);

  const streamAnalysis = async () => {
    setIsStreaming(true);
    setError(null);
    streamedRef.current = "";

    try {
      const achievementDesc = Object.entries(formData)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recommend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            achievement: `Title: ${achievementTitle}\nCategory: ${category}\n${achievementDesc}`,
            category,
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "AI analysis failed");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              streamedRef.current += content;
              setAiAnalysis(streamedRef.current);
            }
          } catch {}
        }
      }

      const text = streamedRef.current.toLowerCase();
      const found = ALL_BENEFITS.filter(b => text.includes(b.toLowerCase()));
      if (found.length === 0) {
        const fallback = ALL_BENEFITS.filter(b => {
          const words = b.toLowerCase().split(" ");
          return words.some(w => w.length > 3 && text.includes(w));
        });
        setAiRecommendedBenefits(fallback.slice(0, 3));
        setSelectedBenefits(fallback.slice(0, 3));
      } else {
        setAiRecommendedBenefits(found);
        setSelectedBenefits(found);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze");
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits(prev =>
      prev.includes(benefit) ? prev.filter(b => b !== benefit) : [...prev, benefit]
    );
  };

  const handleProceed = () => {
    onComplete({
      aiRecommendedBenefits,
      selectedBenefits,
      aiAnalysis: streamedRef.current,
      usedAiRecommendation: mode === "ai",
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Side-by-side layout: AI Analysis left, Benefits right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT: AI Analysis Chat */}
        <div className="flex flex-col rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-primary/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">AI Benefits Analysis</h3>
            {isStreaming && <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />}
            {!isStreaming && !error && (
              <span className="ml-auto rounded-full bg-status-approved/15 px-2 py-0.5 text-[10px] font-medium text-status-approved">Complete</span>
            )}
          </div>

          {error ? (
            <div className="flex items-center gap-2 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
              <button onClick={streamAnalysis} className="ml-2 text-xs font-medium text-primary underline">Retry</button>
            </div>
          ) : (
            <div
              ref={analysisRef}
              className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap min-h-[300px] max-h-[500px]"
            >
              {aiAnalysis || (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your achievement against criteria sheets...
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Benefits Selection */}
        <div className="flex flex-col space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => { setMode("ai"); setSelectedBenefits(aiRecommendedBenefits); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                mode === "ai" ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              AI Recommendation
            </button>
            <button
              onClick={() => setMode("custom")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                mode === "custom" ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Edit3 className="h-4 w-4" />
              Custom Benefits
            </button>
          </div>

          {/* Benefits Grid */}
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {mode === "ai" ? "AI Recommended Benefits" : "Select Your Benefits"}
            </h4>
            <div className="space-y-2">
              {ALL_BENEFITS.map((benefit) => {
                const isSelected = selectedBenefits.includes(benefit);
                const isAiRec = aiRecommendedBenefits.includes(benefit);
                const disabled = mode === "ai" || isStreaming;
                return (
                  <button
                    key={benefit}
                    onClick={() => !disabled && toggleBenefit(benefit)}
                    disabled={disabled}
                    className={`relative flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all ${
                      isSelected
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/20"
                    } ${disabled ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <CheckCircle className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground/30"}`} />
                    <span className="flex-1 font-medium">{benefit}</span>
                    {isAiRec && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary">AI</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleProceed}
            disabled={selectedBenefits.length === 0 || isStreaming}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            Submit Application with {selectedBenefits.length} Benefit{selectedBenefits.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default BenefitsAnalysis;
