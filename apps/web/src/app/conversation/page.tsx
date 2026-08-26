"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Loader2,
  FileText,
  Terminal,
  Clock,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Source {
  document_id: string;
  filename: string;
  excerpt: string;
  chunk_index?: number;
  relevance_score?: number;
}

interface ExecutionTrace {
  intent?: string;
  selected_tools?: string[];
  retrieved_candidates?: number;
  latencies_ms?: {
    retrieval?: number;
    rerank?: number;
    generation?: number;
    total?: number;
  };
  latency_ms?: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  citations?: string[];
  trace?: ExecutionTrace;
  timestamp: string;
}

function ConversationContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { ensureAuth } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const executeQuery = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || loading) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { role: "user", content: q, timestamp: userTimestamp },
    ]);
    setInput("");
    setLoading(true);

    try {
      const token = await ensureAuth();
      if (!token) {
        throw new Error("Unable to establish authenticated session.");
      }

      const res = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: q, max_sources: 5 }),
      });

      const data = await res.json();
      const assistantTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer || "No response received.",
            sources: data.sources || [],
            citations: data.citations || [],
            trace: data.execution_trace,
            timestamp: assistantTimestamp,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${data.detail || "Query execution failed."}`,
            timestamp: assistantTimestamp,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Connection error: ${err.message || "Failed to reach backend."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Run initial query if navigated from home page
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      executeQuery(initialQuery);
    }
  }, [initialQuery]);

  const promptSuggestions = [
    "What do I need to take care of in the next 30 days?",
    "When does my Dell laptop warranty expire?",
    "When is my auto insurance renewal due?",
    "What are the details of my flight booking?",
  ];

  return (
    <div className="flex flex-col h-full bg-[#0C0C10] text-[#F8F3E6] font-sans">
      {/* ── Top Header ── */}
      <div className="px-8 py-4 border-b border-[#22222E] bg-[#111118] flex items-center justify-between shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B55] animate-pulse"></div>
          <div>
            <h1 className="text-sm font-bold text-[#F8F3E6] uppercase tracking-wider">
              CONVERSATION ENGINE // REASONING CONSOLE
            </h1>
            <p className="text-[11px] text-[#8E8E9B]">
              GROUNDED AGENTIC RAG WITH PROMPT INJECTION DEFENSE
            </p>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          className="text-xs text-[#8E8E9B] hover:text-[#FF6B55] flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#181822] border border-[#2A2A38] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear Session
        </button>
      </div>

      {/* ── Message Stream ── */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-3xl mx-auto py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-[#FF6B55]/10 border border-[#FF6B55]/30 flex items-center justify-center text-[#FF6B55]">
              <Terminal className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-display text-[#F8F3E6] mb-2">
              Ready for Query Execution
            </h2>
            <p className="text-sm text-[#A0A0B0] max-w-md mx-auto mb-8 font-sans">
              Ask questions about your connected documents, temporal commitments, and personal memory.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {promptSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => executeQuery(prompt)}
                  className="p-4 rounded-lg bg-[#14141E] border border-[#2E2E40] hover:border-[#FF6B55] hover:bg-[#181826] transition-all text-xs font-mono group"
                >
                  <span className="text-[#FF6B55] mr-2">[{`0${idx + 1}`}]</span>
                  <span className="text-[#D0D0E0] group-hover:text-white">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col gap-2 max-w-4xl mx-auto ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Role Header */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#6E6E80] px-1">
              <span className={msg.role === "user" ? "text-[#FF6B55] font-bold" : "text-[#2563EB] font-bold"}>
                {msg.role === "user" ? "// USER QUERY" : "// NEXUS AGENT"}
              </span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Bubble */}
            <div
              className={`px-5 py-4 rounded-lg text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#FF6B55] text-[#0C0C10] font-medium shadow-[3px_3px_0px_#FFFFFF]"
                  : "bg-[#14141E] border border-[#2A2A3A] text-[#F8F3E6] shadow-sm w-full"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Execution Trace Metadata for Assistant */}
              {msg.trace && (
                <div className="mt-4 pt-3 border-t border-[#222230] flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#8E8E9B]">
                  {msg.trace.intent && (
                    <span className="px-2 py-0.5 rounded bg-[#1F1F2E] text-[#FF6B55] border border-[#3A3A4E]">
                      INTENT: {msg.trace.intent.toUpperCase()}
                    </span>
                  )}
                  {msg.trace.selected_tools && msg.trace.selected_tools.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-[#1F1F2E] text-[#60A5FA] border border-[#3A3A4E]">
                      TOOLS: {msg.trace.selected_tools.join(", ")}
                    </span>
                  )}
                  {msg.trace.latencies_ms && (
                    <span className="flex items-center gap-1 text-[#10B981]">
                      <Clock className="w-3 h-3" />
                      {msg.trace.latencies_ms.total}ms latency
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Source Citations Box */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="w-full mt-1">
                <div className="flex items-center gap-2 mb-2 text-xs font-mono text-[#8E8E9B]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>VERIFIED SOURCE CITATIONS ({msg.sources.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {msg.sources.map((src, si) => (
                    <div
                      key={si}
                      className="p-3 rounded-lg border border-[#222230] bg-[#111118] hover:border-[#2563EB] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-[#FF6B55] shrink-0" />
                          <span className="text-xs font-mono font-bold text-[#F8F3E6] truncate">
                            {src.filename}
                          </span>
                        </div>
                        {src.relevance_score !== undefined && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1F1F2E] text-[#10B981]">
                            {Math.round(src.relevance_score * 100)}% Match
                          </span>
                        )}
                      </div>
                      {src.excerpt && (
                        <p className="text-[11px] text-[#A0A0B0] line-clamp-2 leading-relaxed font-sans">
                          "{src.excerpt}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex flex-col gap-2 max-w-4xl mx-auto items-start">
            <div className="text-[11px] font-mono text-[#6E6E80] px-1">
              // NEXUS AGENT • PROCESSING
            </div>
            <div className="px-5 py-4 rounded-lg bg-[#14141E] border border-[#2A2A3A] text-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-[#FF6B55] animate-spin" />
              <span className="font-mono text-xs text-[#A0A0B0]">
                Running Hybrid Vector Search &amp; Grounded Reasoner...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="px-6 sm:px-12 py-4 border-t border-[#22222E] bg-[#111118] shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center rounded-lg bg-[#14141E] border border-[#333344] focus-within:border-[#FF6B55] focus-within:shadow-[0_0_12px_rgba(255,107,85,0.25)] transition-all p-1.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  executeQuery(input);
                }
              }}
              placeholder="Ask a question about your documents, deadlines, or personal context..."
              rows={1}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-[#F8F3E6] placeholder:text-[#6E6E80] focus:outline-none font-mono resize-none"
            />
            <button
              onClick={() => executeQuery(input)}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded bg-[#FF6B55] text-[#0C0C10] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#FF816D] disabled:opacity-30 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              Send
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] font-mono text-[#6E6E80] mt-2 text-center">
            All responses are strictly grounded in your verified documents.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConversationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[#8E8E9B]">Loading reasoning console...</div>}>
      <ConversationContent />
    </Suspense>
  );
}
