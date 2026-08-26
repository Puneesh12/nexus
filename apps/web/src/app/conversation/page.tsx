"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Loader2,
  FileText,
  Clock,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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

  // Run initial query if passed via URL parameter
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      executeQuery(initialQuery);
    }
  }, [initialQuery]);

  const toggleSources = (idx: number) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const samplePrompts = [
    "What do I need to take care of in the next 30 days?",
    "When does my Dell laptop warranty expire?",
    "When is my auto insurance renewal due?",
    "What is the deadline for my college capstone project?",
  ];

  return (
    <div className="flex flex-col h-full bg-[#0A0A0D] text-[#EDEDED]">
      {/* Top Header */}
      <div className="px-8 py-4 border-b border-[#1C1C22] bg-[#0E0E12] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white">Chat &amp; Query</h1>
          <p className="text-xs text-[#7A7A85]">
            Grounded answers generated from your connected documents.
          </p>
        </div>
        <button
          onClick={() => setMessages([])}
          className="text-xs text-[#8E8E98] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16161D] border border-[#24242E] hover:border-[#383846] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear chat
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-xl mx-auto py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-[#181820] border border-[#262632] flex items-center justify-center text-white mx-auto mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">
              What can I help you find?
            </h2>
            <p className="text-xs text-[#7A7A85] mb-8">
              Ask questions about your uploaded documents, policies, tickets, and deadlines.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => executeQuery(prompt)}
                  className="p-3.5 rounded-lg bg-[#121217] border border-[#1E1E26] hover:border-[#3A3A48] hover:bg-[#16161D] transition-all text-xs text-[#A0A0AB] hover:text-white"
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
            <span className="text-[11px] text-[#5E5E6B] px-1 font-medium">
              {msg.role === "user" ? "You" : "NEXUS"} · {msg.timestamp}
            </span>

            {/* Bubble */}
            <div
              className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#2563EB] text-white rounded-br-none"
                  : "bg-[#14141A] border border-[#22222B] text-[#EDEDED] rounded-bl-none w-full shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Source citations expandable pill */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#202028]">
                  <button
                    onClick={() => toggleSources(idx)}
                    className="flex items-center gap-1.5 text-xs text-[#8E8E98] hover:text-white font-medium transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>{msg.sources.length} source{msg.sources.length > 1 ? "s" : ""} cited</span>
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
                          className="p-3 rounded-lg bg-[#0C0C10] border border-[#1E1E26] text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium text-white truncate">
                              {src.filename}
                            </span>
                            {src.relevance_score !== undefined && (
                              <span className="text-[10px] text-[#10B981] font-mono">
                                Match
                              </span>
                            )}
                          </div>
                          {src.excerpt && (
                            <p className="text-[#8E8E98] text-[11px] line-clamp-2 leading-relaxed">
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
            <span className="text-[11px] text-[#5E5E6B] px-1">NEXUS is thinking...</span>
            <div className="px-5 py-3.5 rounded-2xl rounded-bl-none bg-[#14141A] border border-[#22222B] text-sm flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span className="text-xs text-[#8E8E98]">
                Retrieving relevant excerpts from your documents...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="px-6 sm:px-12 py-4 border-t border-[#1C1C22] bg-[#0E0E12] shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center rounded-xl bg-[#14141A] border border-[#24242E] focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all p-1.5 shadow-sm">
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
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#5E5E6B] focus:outline-none resize-none max-h-32"
            />
            <button
              onClick={() => executeQuery(input)}
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-lg bg-white text-black hover:bg-[#E5E5E5] disabled:opacity-30 transition-all shrink-0"
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A7A85]">Loading conversation...</div>}>
      <ConversationContent />
    </Suspense>
  );
}
