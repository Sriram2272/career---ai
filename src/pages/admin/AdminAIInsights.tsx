import { useState, useRef, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ChatMessage from "@/components/chat/ChatMessage";
import TypingIndicator from "@/components/chat/TypingIndicator";
import {
  Send, Sparkles, Loader2, RotateCcw, MessageSquare, X, Clock,
  TrendingUp, Award, Users, BarChart3, GraduationCap, Target, Lightbulb
} from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };
type ChatSession = { id: string; title: string; date: string; messages: Msg[] };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-assistant`;

const QUICK_ACTIONS = [
  { label: "Department Rankings", icon: TrendingUp, prompt: "Rank all departments by placement rate. Show a table with total students, placed count, placement percentage, and average CGPA for each.", color: "text-blue-500" },
  { label: "Top Performers", icon: Award, prompt: "Who are the top 10 students on campus by CGPA? Show their name, department, CGPA, skills, and placement status.", color: "text-amber-500" },
  { label: "Unplaced High-Potential", icon: Users, prompt: "List all unplaced students with CGPA above 8.0. Include their department, skills, and any suggestions for improvement.", color: "text-red-500" },
  { label: "Monthly Trends", icon: BarChart3, prompt: "Give me a detailed analysis of placement trends over the last few months. Which months had the most activity?", color: "text-green-500" },
  { label: "Section Analysis", icon: GraduationCap, prompt: "Compare all sections — which sections are performing best and worst in placements? Show data for each section.", color: "text-purple-500" },
  { label: "Skill Gaps", icon: Target, prompt: "What are the most in-demand skills based on job postings? Which skills are our students lacking?", color: "text-teal-500" },
  { label: "Action Plan", icon: Lightbulb, prompt: "Based on all the data, suggest a detailed action plan to improve overall placement rate. Be specific with department-wise recommendations.", color: "text-orange-500" },
  { label: "Best Student", icon: Award, prompt: "Suggest the single best student on campus considering CGPA, skills, aptitude score, programming score, and overall profile. Explain why.", color: "text-pink-500" },
];

const AdminAIInsights = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    try { return JSON.parse(localStorage.getItem("admin_ai_history") || "[]"); }
    catch { return []; }
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Save session to history
  useEffect(() => {
    if (messages.length >= 2) {
      const title = messages[0]?.content?.slice(0, 50) || "New Chat";
      const session: ChatSession = {
        id: currentSessionId || crypto.randomUUID(),
        title, date: new Date().toISOString(), messages,
      };
      if (!currentSessionId) setCurrentSessionId(session.id);
      setChatHistory(prev => {
        const existing = prev.findIndex(s => s.id === session.id);
        const updated = existing >= 0
          ? prev.map((s, i) => i === existing ? session : s)
          : [session, ...prev];
        localStorage.setItem("admin_ai_history", JSON.stringify(updated.slice(0, 50)));
        return updated.slice(0, 50);
      });
    }
  }, [messages]);

  const streamChat = useCallback(async (allMsgs: Msg[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMsgs }),
    });

    if (!resp.ok || !resp.body) {
      const errMsg = resp.status === 429 ? "⚠️ Rate limited. Please wait a moment and try again."
        : resp.status === 402 ? "⚠️ AI credits exhausted. Please add funds."
        : "⚠️ Something went wrong. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const parsed = JSON.parse(json);
          const c = parsed.choices?.[0]?.delta?.content;
          if (c) {
            fullText += c;
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
  }, []);

  const send = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;
    const userMsg: Msg = { role: "user", content };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setIsLoading(true);
    try { await streamChat(allMsgs); }
    catch { setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Network error. Please try again." }]); }
    setIsLoading(false);
  }, [input, messages, isLoading, streamChat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const resetChat = () => { setMessages([]); setCurrentSessionId(null); };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem("admin_ai_history", JSON.stringify(updated));
      return updated;
    });
    if (currentSessionId === id) resetChat();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const isEmpty = messages.length === 0;

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] -mx-4 -my-4 md:-mx-8 md:-my-6">
        {/* Chat History Sidebar */}
        <div className={`${showHistory ? "w-[260px] border-r border-border" : "w-0"} transition-all duration-300 overflow-hidden bg-card/80 backdrop-blur-sm flex flex-col shrink-0`}>
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
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-accent/50 transition-colors group relative ${
                    currentSessionId === session.id ? "bg-accent/60 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-foreground truncate pr-6">{session.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(session.date)}</p>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
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
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <MessageSquare className="h-4 w-4" /> Chat History
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-foreground">PlaceAI Analytics</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={resetChat} className="gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" /> New Chat
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto" ref={scrollRef}>
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center min-h-full px-4 py-16">
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">What would you like to know?</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      I have access to all your placement data — students, companies, applications, departments, and more. Ask me anything!
                    </p>
                  </div>

                  <div className="w-full max-w-xl">
                    <div className="relative border border-border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about placements, departments, students, trends..."
                        className="min-h-[80px] max-h-[140px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm p-4 pr-14 rounded-2xl"
                        rows={3}
                      />
                      <Button
                        size="icon"
                        onClick={() => send()}
                        disabled={!input.trim() || isLoading}
                        className="absolute bottom-3 right-3 h-9 w-9 rounded-xl gradient-primary shadow-sm"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                    {QUICK_ACTIONS.map((qa) => (
                      <button
                        key={qa.label}
                        onClick={() => send(qa.prompt)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-sm font-medium text-foreground group"
                      >
                        <qa.icon className={`h-4 w-4 ${qa.color} group-hover:scale-110 transition-transform`} />
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
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
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["Top performers by CGPA", "Worst performing sections", "Unplaced students analysis", "Skill gap report", "Compare departments"].map(q => (
                    <button key={q} onClick={() => send(q)} className="text-[10px] px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative border border-border rounded-xl bg-background">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about placements, departments, students..."
                      className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm p-3"
                      rows={1}
                    />
                  </div>
                  <Button size="icon" onClick={() => send()} disabled={!input.trim() || isLoading} className="h-10 w-10 shrink-0 rounded-xl gradient-primary">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                  PlaceAI Analytics • Powered by Lovable AI
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAIInsights;
