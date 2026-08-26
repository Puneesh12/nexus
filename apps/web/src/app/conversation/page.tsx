"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Loader2,
  FileText,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

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
  citations?: string[];
  timestamp: string;
}

function ConversationContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { ensureAuth } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
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

    const userTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
      const assistantTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer || "No response available.",
            sources: data.sources || [],
            citations: data.citations || [],
            timestamp: assistantTimestamp,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${data.detail || "Query failed."}`,
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
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      executeQuery(initialQuery);
    }
  }, [initialQuery]);

  const toggleSources = (idx: number) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const samplePrompts = [
    "When does my Dell laptop warranty expire?",
    "When is my auto insurance renewal due?",
    "What do I need to take care of in the next 30 days?",
    "What are the details of my flight booking?",
  ];

  return (
    <div className="flex flex-col h-full chronotask-canvas text-[#1F2937]">
      {/* ── Header ── */}
      <div className="px-8 py-4 bg-white border-b border-[#E5E7EB] flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#111827]">
              Inbox &amp; Conversation
            </h1>
            <p className="text-xs text-[#6B7280]">
              Ask questions grounded in your connected documents.
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages([])}
          className="text-xs font-semibold text-[#4B5563] hover:text-[#111827] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-colors shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* ── Message Stream ── */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-xl mx-auto py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#2563EB] mx-auto mb-4 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-1">
              Ask ChronoTask anything
            </h2>
            <p className="text-xs text-[#6B7280] mb-8">
              Search across your policies, travel tickets, warranties, and files.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => executeQuery(prompt)}
                  className="card-chronotask p-4 text-xs font-semibold text-[#374151] hover:text-[#2563EB] hover:border-[#93C5FD] transition-all"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col gap-1.5 max-w-3xl mx-auto ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <span className="text-[11px] text-[#9CA3AF] px-1 font-semibold">
              {msg.role === "user" ? "Amanda" : "ChronoTask Assistant"} · {msg.timestamp}
            </span>

            {/* Bubble */}
            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#2563EB] text-white rounded-br-xs shadow-sm font-medium"
                  : "card-chronotask text-[#1F2937] rounded-bl-xs w-full"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Sources Accordion */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
                  <button
                    onClick={() => toggleSources(idx)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#2563EB] transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{msg.sources.length} Verified Source{msg.sources.length > 1 ? "s" : ""}</span>
                    {expandedSources[idx] ? (
                      <ChevronUp className="w-3 h-3 ml-0.5" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    )}
                  </button>

                  {expandedSources[idx] && (
                    <div className="mt-2.5 space-y-2">
                      {msg.sources.map((src, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-[#111827] truncate">
                              {src.filename}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] font-bold">
                              Verified
                            </span>
                          </div>
                          {src.excerpt && (
                            <p className="text-[#6B7280] text-[11px] line-clamp-2 leading-relaxed">
                              "{src.excerpt}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col gap-1.5 max-w-3xl mx-auto items-start">
            <span className="text-[11px] text-[#9CA3AF] px-1">ChronoTask is searching...</span>
            <div className="card-chronotask px-4 py-3 text-sm flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
              <span className="text-xs text-[#6B7280] font-medium">
                Searching documents and synthesizing answer...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="px-6 sm:px-12 py-4 bg-white border-t border-[#E5E7EB] shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/10 transition-all p-1.5 shadow-2xs">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  executeQuery(input);
                }
              }}
              placeholder="Ask a question about your documents, deadlines, or events..."
              rows={1}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none resize-none max-h-32"
            />
            <button
              onClick={() => executeQuery(input)}
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-30 transition-all shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConversationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#6B7280]">Loading conversation...</div>}>
      <ConversationContent />
    </Suspense>
  );
}
