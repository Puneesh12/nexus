"use client";

import { useState } from "react";
import { Send, Loader2, FileText, ExternalLink } from "lucide-react";

interface Source {
  document_id: string;
  filename: string;
  excerpt: string;
  chunk_index?: number;
  relevance_score?: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, max_sources: 5 }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "No answer available.",
          sources: data.sources || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to reach NEXUS. Please ensure the API is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold text-foreground">Conversation</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ask questions about your documents and personal context.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm">
              Ask NEXUS anything about your uploaded documents.
            </p>
            <p className="text-xs mt-2 opacity-60">
              Example: "What does my laptop warranty cover?"
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            {/* Message bubble */}
            <div
              className={`max-w-2xl px-4 py-3 rounded-lg text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              {msg.content}
            </div>

            {/* Sources */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="max-w-2xl w-full">
                <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
                  Sources
                </p>
                <div className="space-y-1.5">
                  {msg.sources.map((src, si) => (
                    <div
                      key={si}
                      className="flex items-start gap-2 px-3 py-2 rounded-md border border-border bg-card"
                    >
                      <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {src.filename}
                        </p>
                        {src.excerpt && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {src.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="px-4 py-3 rounded-lg border border-border bg-card">
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-8 py-4 border-t border-border shrink-0">
        <div className="flex items-end gap-3 max-w-2xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask about your information…"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={submit}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
