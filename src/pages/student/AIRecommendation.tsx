import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ChatMessage from "@/components/chat/ChatMessage";
import TypingIndicator from "@/components/chat/TypingIndicator";
import {
  Send, FileText, Target, Mic, Brain,
  Loader2, RotateCcw, GraduationCap, Building2,
  MessageSquare, X, Clock
} from "lucide-react";
import MockInterviewSetup, { type MockInterviewConfig } from "@/components/chat/MockInterviewSetup";

type Msg = { role: "user" | "assistant"; content: string };
type ChatSession = { id: string; title: string; date: string; messages: Msg[]; action: string | null };

const QUICK_ACTIONS = [
  { label: "Resume Roast 🔥", action: "resume_roast", icon: FileText, prompt: "Roast my resume! Be brutally honest and tell me exactly what to fix.", color: "text-red-500" },
  { label: "Skill Gap Analysis", action: "skill_gap", icon: Target, prompt: "Analyze my skill gaps for top tech companies and give me a learning roadmap.", color: "text-blue-500" },
  { label: "Mock Interview", action: "mock_prep", icon: Mic, prompt: "Start a mock interview session with me.", color: "text-green-500" },
  { label: "Career Roadmap", action: "general", icon: Brain, prompt: "Create a personalized 90-day career roadmap for me based on my profile.", color: "text-purple-500" },
  { label: "Company Intel", action: "general", icon: Building2, prompt: "What are the top companies visiting LPU this season? What do they look for?", color: "text-amber-500" },
  { label: "Placement Strategy", action: "general", icon: GraduationCap, prompt: "Help me create a placement strategy. Which companies should I target and in what order?", color: "text-teal-500" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-coach`;

const AIRecommendation = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [showMockSetup, setShowMockSetup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("ai_coach_history") || "[]");
    } catch { return []; }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Save session to history when messages change
  useEffect(() => {
    if (messages.length >= 2) {
      const title = messages[0]?.content?.slice(0, 50) || "New Chat";
      const session: ChatSession = {
        id: currentSessionId || crypto.randomUUID(),
        title,
        date: new Date().toISOString(),
        messages,
        action: currentAction,
      };
      if (!currentSessionId) setCurrentSessionId(session.id);

      setChatHistory(prev => {
        const existing = prev.findIndex(s => s.id === session.id);
        const updated = existing >= 0
          ? prev.map((s, i) => i === existing ? session : s)
          : [session, ...prev];
        localStorage.setItem("ai_coach_history", JSON.stringify(updated.slice(0, 50)));
        return updated.slice(0, 50);
      });
    }
  }, [messages]);

  const streamChat = async (userMessages: Msg[], action?: string) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: userMessages,
        action: action || currentAction || "general",
        profileData: profile,
      }),
    });

    if (resp.status === 429) { toast.error("Rate limited — try again in a moment."); throw new Error("429"); }
    if (resp.status === 402) { toast.error("AI credits exhausted. Please add credits."); throw new Error("402"); }
    if (!resp.ok || !resp.body) throw new Error("Stream failed");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: fullText } : m);
              }
              return [...prev, { role: "assistant", content: fullText }];
            });
          }
        } catch { /* partial json */ }
      }
    }
  };

  const send = async (text: string, action?: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput("");
    setIsLoading(true);
    if (action) setCurrentAction(action);

    try {
      await streamChat(updatedMsgs, action);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setCurrentAction(null);
    setShowMockSetup(false);
    setCurrentSessionId(null);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentAction(session.action);
    setCurrentSessionId(session.id);
    setShowHistory(false);
    setShowMockSetup(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem("ai_coach_history", JSON.stringify(updated));
      return updated;
    });
    if (currentSessionId === id) resetChat();
  };

  const handleMockInterviewStart = (config: MockInterviewConfig) => {
    setShowMockSetup(false);
    const prompt = `I want a mock interview for **${config.company}** for the role of **${config.role}**.
- Difficulty: ${config.difficulty}
- Number of questions: ${config.questionCount}
- Interview type: ${config.interviewType}

Start the interview now. Ask me ONE question at a time. After I answer, rate my response, give a model answer, then ask the next question. At the end, give me an overall score and feedback.`;
    send(prompt, "mock_prep");
  };

  const handleQuickAction = (qa: typeof QUICK_ACTIONS[0]) => {
    if (qa.action === "mock_prep") {
      setShowMockSetup(true);
    } else {
      send(qa.prompt, qa.action);
    }
  };

  const isEmpty = messages.length === 0 && !showMockSetup;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] -mx-4 -my-4 md:-mx-8 md:-my-6">
        {/* Chat History Sidebar */}
        <div
          className={`${showHistory ? "w-[260px] border-r border-border" : "w-0"} transition-all duration-300 overflow-hidden bg-card/80 backdrop-blur-sm flex flex-col shrink-0`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Chats</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHistory(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs px-4 text-center gap-2">
                <Clock className="h-8 w-8 opacity-30" />
                <p>No chat history yet</p>
              </div>
            ) : (
              chatHistory.map(session => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-accent/50 transition-colors group ${
                    currentSessionId === session.id ? "bg-accent/60 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(session.date)}</p>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/60 backdrop-blur-sm shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" /> Chat History
            </Button>
            <Button variant="outline" size="sm" onClick={resetChat} className="gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" /> New Chat
            </Button>
          </div>

          {/* Chat Messages - scrollable div instead of ScrollArea */}
          <div className="flex-1 overflow-y-auto" ref={scrollRef}>
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center min-h-full px-4 py-16">
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">How can I help you today?</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Ask me anything about placements, career planning, or get personalized guidance based on your profile.
                    </p>
                  </div>

                  <div className="w-full max-w-xl">
                    <div className="relative border border-border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about placements, career advice, interview tips..."
                        className="min-h-[80px] max-h-[140px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm p-4 pr-14 rounded-2xl"
                        rows={3}
                      />
                      <Button
                        size="icon"
                        onClick={() => send(input)}
                        disabled={!input.trim() || isLoading}
                        className="absolute bottom-3 right-3 h-9 w-9 rounded-xl gradient-primary shadow-sm"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                    {QUICK_ACTIONS.map((qa) => (
                      <button
                        key={qa.label}
                        onClick={() => handleQuickAction(qa)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-sm font-medium text-foreground group"
                      >
                        <qa.icon className={`h-4 w-4 ${qa.color} group-hover:scale-110 transition-transform`} />
                        {qa.label}
                      </button>
                    ))}
                  </div>

                  {profile && (profile.branch || profile.cgpa || profile.skills?.length) && (
                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                      <span className="text-[11px] text-muted-foreground mr-1">Your profile:</span>
                      {profile.branch && <Badge variant="secondary" className="text-[11px]">{profile.branch}</Badge>}
                      {profile.cgpa && <Badge variant="secondary" className="text-[11px]">CGPA: {String(profile.cgpa)}</Badge>}
                      {profile.skills?.slice(0, 3).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[11px]">{s}</Badge>
                      ))}
                      {(profile.skills?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-[11px]">+{(profile.skills?.length || 0) - 3} more</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : showMockSetup ? (
              <div className="flex items-center justify-center min-h-full py-8 px-4">
                <MockInterviewSetup onStart={handleMockInterviewStart} onCancel={() => setShowMockSetup(false)} />
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-5 p-4 pb-6">
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={isLoading && msg.role === "assistant" && i === messages.length - 1}
                  />
                ))}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && <TypingIndicator />}
              </div>
            )}
          </div>

          {/* Bottom Input */}
          {!isEmpty && (
            <div className="border-t border-border bg-card/60 backdrop-blur-sm px-4 py-3 shrink-0">
              <div className="max-w-3xl mx-auto flex items-end gap-2">
                <div className="flex-1 relative border border-border rounded-xl bg-background">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm p-3"
                    rows={1}
                  />
                </div>
                <Button
                  size="icon"
                  onClick={() => send(input)}
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 shrink-0 rounded-xl gradient-primary"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5 max-w-3xl mx-auto">
                PlaceMe AI uses your profile to personalize advice • Powered by Lovable AI
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIRecommendation;
