import { Sparkles } from "lucide-react";

const TypingIndicator = () => (
  <div className="flex gap-3 justify-start animate-fade-in">
    <div className="flex-shrink-0 mt-1">
      <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
      </div>
    </div>
    <div className="bg-card border border-border shadow-sm rounded-2xl rounded-bl-sm px-5 py-4">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  </div>
);

export default TypingIndicator;
