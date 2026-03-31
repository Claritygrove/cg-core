import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Sparkles, Store, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

// ─── Store / context definitions ──────────────────────────────────────────────

interface Context {
  id: string;
  label: string;
  sublabel: string;
  type: "store" | "marketing";
  color: string;
}

const CONTEXTS: Context[] = [
  { id: "pc-portage",      label: "PC Portage",      sublabel: "Plato's Closet · #80237", type: "store",     color: "bg-sky-500/10 border-sky-500/20 hover:border-sky-400/40" },
  { id: "se-portage",      label: "SE Portage",      sublabel: "Style Encore · #60039",   type: "store",     color: "bg-violet-500/10 border-violet-500/20 hover:border-violet-400/40" },
  { id: "pc-east-lansing", label: "PC East Lansing", sublabel: "Plato's Closet · #80185", type: "store",     color: "bg-sky-500/10 border-sky-500/20 hover:border-sky-400/40" },
  { id: "pc-jackson",      label: "PC Jackson",      sublabel: "Plato's Closet · #80634", type: "store",     color: "bg-sky-500/10 border-sky-500/20 hover:border-sky-400/40" },
  { id: "pc-ann-arbor",    label: "PC Ann Arbor",    sublabel: "Plato's Closet · #80726", type: "store",     color: "bg-sky-500/10 border-sky-500/20 hover:border-sky-400/40" },
  { id: "pc-canton",       label: "PC Canton",       sublabel: "Plato's Closet · #80783", type: "store",     color: "bg-sky-500/10 border-sky-500/20 hover:border-sky-400/40" },
  { id: "pc-novi",         label: "PC Novi",         sublabel: "Plato's Closet · #80877", type: "store",     color: "bg-sky-500/10 border-sky-500/20 hover:border-sky-400/40" },
  { id: "ev-marketing",    label: "EV Marketing",    sublabel: "Cross-store marketing",   type: "marketing", color: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-400/40" },
];

// ─── Prepopulated prompts ─────────────────────────────────────────────────────

const STORE_PROMPTS = [
  "What are my high-sales subcategories that need attention?",
  "Help me plan a floorset",
  "Help me produce a buy summary sheet",
  "Make me a to-do list",
  "What should I prioritize buying this week?",
  "Show me my sell-through trends",
  "What inventory am I carrying too much of?",
  "Help me build a markdown strategy",
  "Help me write a staff communication",
];

// ─── Chat message types ───────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const PLACEHOLDER_REPLY =
  "ResaleAI integration is not yet active. Once connected, this will pull live data from your store and generate a real response. You can connect ResaleAI on the Integrations page.";

// ─── Chat view ────────────────────────────────────────────────────────────────

function ChatView({ context, onBack }: { context: Context; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: trimmed };
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      text: PLACEHOLDER_REPLY,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="shrink-0 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Ask EV
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight leading-none">{context.label}</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">{context.sublabel}</p>
          </div>
        </div>
      </div>

      {/* Messages or empty state */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-[0.07em]">Suggested prompts</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STORE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="text-left px-4 py-3 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-[13px] text-foreground/80 hover:text-foreground leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-muted/60 text-foreground/90 rounded-tl-sm border border-border/40"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {/* Suggested prompts still visible after messages */}
            <div className="pt-2">
              <p className="text-[11px] text-muted-foreground mb-2">Suggested</p>
              <div className="flex flex-wrap gap-2">
                {STORE_PROMPTS.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="text-[11px] px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-border/50">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${context.label}…`}
            rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-xl bg-muted/50 border border-border/70 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors leading-relaxed"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ─── Selector grid ────────────────────────────────────────────────────────────

function ContextSelector({ onSelect }: { onSelect: (ctx: Context) => void }) {
  const stores = CONTEXTS.filter((c) => c.type === "store");
  const marketing = CONTEXTS.filter((c) => c.type === "marketing");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Ask EV</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a store to start a conversation — get insights, summaries, and recommendations powered by your data.
          </p>
        </div>
      </div>

      {/* Stores */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-3 flex items-center gap-2">
          <Store className="h-3 w-3" />
          Stores
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stores.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() => onSelect(ctx)}
              className={`text-left p-4 rounded-xl border transition-all ${ctx.color} group`}
            >
              <div className="font-semibold text-sm text-foreground group-hover:text-foreground leading-snug">{ctx.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{ctx.sublabel}</div>
              <div className="flex items-center gap-1 mt-3 text-[11px] text-muted-foreground/60 group-hover:text-primary/70 transition-colors">
                <Sparkles className="h-3 w-3" />
                Ask a question
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Marketing */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-3 w-3" />
          Company
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {marketing.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() => onSelect(ctx)}
              className={`text-left p-4 rounded-xl border transition-all ${ctx.color} group`}
            >
              <div className="font-semibold text-sm text-foreground group-hover:text-foreground leading-snug">{ctx.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{ctx.sublabel}</div>
              <div className="flex items-center gap-1 mt-3 text-[11px] text-muted-foreground/60 group-hover:text-emerald-400/70 transition-colors">
                <Sparkles className="h-3 w-3" />
                Coming soon
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Marketing placeholder ────────────────────────────────────────────────────

function MarketingView({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Ask EV
      </button>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight leading-none">EV Marketing</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Cross-store marketing</p>
        </div>
      </div>
      <Card className="border-dashed">
        <div className="px-8 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-foreground/70">Coming soon</p>
          <p className="text-[12px] text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
            Marketing AI tools for Eagle V will be available here — campaign planning, social content, and cross-store promotions.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function AskEV() {
  const [selected, setSelected] = useState<Context | null>(null);

  if (!selected) {
    return <ContextSelector onSelect={setSelected} />;
  }

  if (selected.type === "marketing") {
    return <MarketingView onBack={() => setSelected(null)} />;
  }

  return <ChatView context={selected} onBack={() => setSelected(null)} />;
}
