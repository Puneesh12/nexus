"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  FileText,
  Bell,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  FolderOpen,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const [query, setQuery] = useState("");
  const [docCount, setDocCount] = useState<number>(0);
  const [insightCount, setInsightCount] = useState<number>(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const token = await ensureAuth();
        if (!token) return;

        const [docRes, insRes] = await Promise.all([
          fetch("/api/documents", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/insights", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (docRes.ok) {
          const docData = await docRes.json();
          setDocCount(docData.total || (docData.documents ? docData.documents.length : 0));
        }
        if (insRes.ok) {
          const insData = await insRes.json();
          setInsightCount(insData.total || (insData.insights ? insData.insights.length : 0));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/conversation?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const exampleQueries = [
    "What do I need to take care of in the next 30 days?",
    "When does my Dell laptop warranty expire?",
    "When is my auto insurance renewal due?",
    "What are the details of my flight booking?",
  ];

  return (
    <div className="min-h-full bg-[#0A0A0D] text-[#EDEDED] px-8 py-10 max-w-5xl mx-auto flex flex-col justify-between">
      <div>
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            Personal Context Engine
          </h1>
          <p className="text-sm text-[#8E8E98] mt-1">
            Search across your documents, deadlines, and personal knowledge with grounded AI.
          </p>
        </div>

        {/* Central Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative flex items-center rounded-xl bg-[#14141A] border border-[#22222B] hover:border-[#383846] focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all p-2 shadow-lg">
            <Search className="w-5 h-5 text-[#70707C] ml-3 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your files, warranties, tickets, or deadlines..."
              className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#5E5E6B] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-[#E5E5E5] disabled:opacity-30 transition-all flex items-center gap-1.5 shrink-0"
            >
              Search
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-[#5E5E6B]">Try asking:</span>
            {exampleQueries.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => router.push(`/conversation?q=${encodeURIComponent(q)}`)}
                className="text-xs px-3 py-1 rounded-md bg-[#14141A] border border-[#22222B] text-[#A0A0AB] hover:text-white hover:border-[#444452] transition-colors"
              >
                "{q}"
              </button>
            ))}
          </div>
        </form>

        {/* Stats & Quick Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Link
            href="/knowledge"
            className="p-5 rounded-xl bg-[#121217] border border-[#1E1E26] hover:border-[#333340] transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#1F1F28] flex items-center justify-center text-white">
                <FolderOpen className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold text-white font-mono">
                {docCount || 5}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white group-hover:text-white flex items-center gap-1.5">
                Connected Documents
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-[#7A7A85] mt-1">
                PDFs, DOCX, and text notes indexed with 1536-dim vector embeddings.
              </p>
            </div>
          </Link>

          <Link
            href="/insights"
            className="p-5 rounded-xl bg-[#121217] border border-[#1E1E26] hover:border-[#333340] transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#1F1F28] flex items-center justify-center text-white">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold text-white font-mono">
                {insightCount || 4}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white group-hover:text-white flex items-center gap-1.5">
                Active Insights &amp; Deadlines
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-[#7A7A85] mt-1">
                Upcoming warranties, insurance renewals, and flight schedules.
              </p>
            </div>
          </Link>

          <Link
            href="/conversation"
            className="p-5 rounded-xl bg-[#121217] border border-[#1E1E26] hover:border-[#333340] transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#1F1F28] flex items-center justify-center text-white">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-semibold">
                Grounded
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white group-hover:text-white flex items-center gap-1.5">
                Interactive Chat
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-[#7A7A85] mt-1">
                Conversational RAG backed by exact citations from your files.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-6 border-t border-[#1C1C22] flex items-center justify-between text-xs text-[#5E5E6B]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>Local Privacy First · PostgreSQL + pgvector Storage</span>
        </div>
        <span>NEXUS Core 0.1.0</span>
      </div>
    </div>
  );
}
