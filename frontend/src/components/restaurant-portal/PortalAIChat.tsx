// UI-only redesign: Restyled AI assistant chat interface with message bubbles and prompt suggestions
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Bot, Sparkles, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message { role: "user" | "assistant"; content: string; id: string }

const SUGGESTED = [
  "What were my best-performing menu items last month?",
  "When are my peak booking times during the week?",
  "How can I improve my restaurant's average rating?",
  "Summarize my recent reservation & revenue trends",
];

export function PortalAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    const history = [...historyRef.current];
    historyRef.current = [...history, { role: "user", content: text }];
    try {
      const res = await fetch("/api/proxy/restaurant-portal/ai/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = (await res.json()) as { message: string };
      const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: data.message };
      setMessages((p) => [...p, aiMsg]);
      historyRef.current = [...historyRef.current, { role: "assistant", content: data.message }];
    } catch {
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, the AI service is currently unavailable." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center max-w-lg mx-auto py-12">
            <div className="relative grid size-16 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-[#47131F]/20">
              <Bot className="size-8" />
              <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold ring-2 ring-background">
                AI
              </span>
            </div>
            <div className="space-y-1.5">
              <h2 className="font-heading text-2xl font-bold text-foreground">AgentDine AI Studio</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">Ask questions about your restaurant operations, revenue analytics, menu performance, or guest reviews.</p>
            </div>
            <div className="grid gap-2.5 w-full pt-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 text-xs font-semibold text-left text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all shadow-2xs"
                >
                  <Sparkles className="size-4 shrink-0 text-primary group-hover:scale-110 transition-transform" />
                  <span className="flex-1 min-w-0 truncate">{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3.5 items-end ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${m.role === "user" ? "bg-primary text-white shadow-xs" : "bg-card border border-border/80 text-foreground"}`}>
                  {m.role === "user" ? "U" : <Bot className="size-4 text-primary" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-xs font-sans leading-relaxed shadow-xs ${m.role === "user" ? "bg-primary text-white rounded-br-xs whitespace-pre-wrap font-medium" : "bg-card border border-border/80 text-foreground rounded-bl-xs"}`}>
                  {m.role === "user" ? m.content : (
                    <div className="prose prose-xs max-w-none dark:prose-invert">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3.5 items-end">
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-card border border-border/80 text-foreground">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="bg-card border border-border/80 rounded-2xl rounded-bl-xs px-5 py-4 flex gap-1.5 shadow-2xs">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="size-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border/70 bg-card/85 backdrop-blur-md px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-end gap-2.5">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask AI about menu sales, peak hours, ratings..."
            disabled={loading}
            rows={1}
            className="min-h-[44px] max-h-32 resize-none flex-1 rounded-2xl border-border/80 text-xs font-sans focus:ring-2 focus:ring-primary/30"
          />
          <Button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            size="icon"
            className="size-11 shrink-0 rounded-2xl bg-primary hover:bg-primary text-white shadow-sm"
          >
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
