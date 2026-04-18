import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const normalizeAnalyticsMarkdown = (value: string) => {
  const lines = value.split(/\r?\n/);
  const normalized: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed.includes("|") || !trimmed.startsWith("|")) {
      normalized.push(line);
      continue;
    }

    const hasHeader = /^\|.+\|$/.test(trimmed);
    const nextLine = lines[i + 1]?.trim() ?? "";
    const hasDivider = /^\|(?:\s*:?-{3,}:?\s*\|)+$/.test(nextLine);

    if (!hasHeader || !hasDivider) {
      normalized.push(line);
      continue;
    }

    const tableBlock = [trimmed, nextLine];
    i += 1;

    while (i + 1 < lines.length) {
      const next = lines[i + 1]?.trim() ?? "";
      if (!next.startsWith("|")) break;

      const rowMatches = next.match(/\|[^|\n]+(?=\|)/g);
      if (rowMatches && rowMatches.length > 1 && !/^\|(?:\s*:?-{3,}:?\s*\|)+$/.test(next)) {
        tableBlock.push(`|${rowMatches.map((cell) => cell.trim()).join("|")}|`);
      } else {
        tableBlock.push(next);
      }

      i += 1;
    }

    normalized.push(...tableBlock, "");
  }

  return normalized.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const ChatMessage = memo(({ role, content, isStreaming }: ChatMessageProps) => {
  const isUser = role === "user";
  const formattedContent = useMemo(() => normalizeAnalyticsMarkdown(content), [content]);

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 transition-all duration-300",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-border shadow-sm rounded-bl-sm"
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="ai-markdown text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mt-4 mb-2 first:mt-0 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mt-3 mb-1.5 first:mt-0 text-foreground">{children}</h3>,
                p: ({ children }) => <p className="mb-2.5 last:mb-0 text-foreground/90 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="text-foreground/80 italic">{children}</em>,
                ul: ({ children }) => <ul className="mb-3 last:mb-0 space-y-1.5 pl-1">{children}</ul>,
                ol: ({ children }) => <ol className="mb-3 last:mb-0 space-y-1.5 pl-5 list-decimal">{children}</ol>,
                li: ({ node, children, ...props }) => {
                  const parent = node?.position ? undefined : undefined;
                  // Check if inside an ol by looking at ordered prop or context
                  const isOrdered = (props as any).ordered;
                  return (
                    <li className="text-foreground/90 mb-1" {...props}>
                      {!isOrdered && (
                        <span className="inline-block mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 mr-2 align-middle" />
                      )}
                      {children}
                    </li>
                  );
                },
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="px-1.5 py-0.5 rounded-md bg-muted text-primary font-mono text-xs font-medium" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={cn("block p-3 rounded-lg bg-muted/80 font-mono text-xs overflow-x-auto my-2", className)} {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <pre className="my-2.5 rounded-xl bg-muted/80 border border-border overflow-hidden">{children}</pre>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-3 border-primary/40 pl-3 my-2.5 text-foreground/70 italic">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                    <table className="w-full min-w-[520px] text-sm border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-muted/70">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-border/50">{children}</tbody>,
                tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors align-top">{children}</tr>,
                th: ({ children }) => <th className="px-4 py-3 text-left font-semibold text-foreground border-b border-border whitespace-nowrap">{children}</th>,
                td: ({ children }) => <td className="px-4 py-3 text-foreground/85 border-b border-border/40 whitespace-nowrap">{children}</td>,
                hr: () => <hr className="my-3 border-border/50" />,
              }}
            >
              {formattedContent}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-primary/60 rounded-sm animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        )}
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
