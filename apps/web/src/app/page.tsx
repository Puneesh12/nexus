"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Database,
  Calendar,
  Sparkles,
  Zap,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/conversation?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const quickPrompts = [
    "What do I need to take care of in the next 30 days?",
    "When does my Dell laptop warranty expire?",
    "When is my auto insurance renewal due?",
    "What is the deadline for my college capstone submission?",
  ];

  return (
    <div className="min-h-full flex flex-col bg-[#0C0C10] text-[#F8F3E6] font-sans pb-16">
      {/* ── Top Bar / Metadata Strip ── */}
      <div className="px-8 py-3.5 border-b border-[#22222E] bg-[#111118]/80 flex items-center justify-between text-xs font-mono text-[#8E8E9B]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-[#FF6B55] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#FF6B55] inline-block animate-pulse"></span>
            NEXUS ENGINE v0.1
          </span>
          <span className="hidden sm:inline text-[#444455]">|</span>
          <span className="hidden sm:inline">PGVECTOR 1536-DIM · HYBRID RAG</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#1C1C28] text-[#F8F3E6] border border-[#333344]">
            LATENCY &lt; 150ms
          </span>
        </div>
      </div>

      {/* ── Hero Banner Section (Pixelate Brutalist Style) ── */}
      <section className="relative px-8 pt-12 pb-16 border-b border-[#22222E] overflow-hidden pixel-grid hero-glow">
        <div className="max-w-5xl mx-auto">
          {/* Tag Pill Strip */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="badge-coral text-[11px] px-2.5 py-1 rounded font-mono font-bold">
              AGENTIC OS
            </span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#181824] border border-[#2E2E40] text-[#B0B0C0]">
              [01] TEMPORAL REASONING
            </span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#181824] border border-[#2E2E40] text-[#B0B0C0]">
              [02] KNOWLEDGE GRAPH
            </span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#181824] border border-[#2E2E40] text-[#B0B0C0]">
              [03] GROUNDED CITATIONS
            </span>
          </div>

          {/* Massive Display Title */}
          <div className="mb-6">
            <h1 className="text-6xl sm:text-8xl font-extrabold tracking-tighter uppercase font-display text-[#F8F3E6] leading-none drop-shadow-sm">
              NEXUS
            </h1>
            <p className="text-xl sm:text-2xl font-light text-[#FF6B55] mt-2 font-display tracking-tight">
              Personal Context Engine &amp; Agentic RAG Operating System
            </p>
          </div>

          <p className="text-sm sm:text-base text-[#A0A0B0] max-w-2xl leading-relaxed mb-8">
            Connects your documents, emails, warranties, events, and personal knowledge.
            Uses hybrid vector search, knowledge graph entity linking, and agentic reasoning to answer questions with strict proof of evidence.
          </p>

          {/* Interactive Search Console */}
          <form onSubmit={handleSearch} className="max-w-3xl mb-6">
            <div className="relative flex items-center rounded-lg bg-[#14141E] border-2 border-[#FF6B55] shadow-[4px_4px_0px_#FF6B55] p-1.5 transition-all">
              <Search className="w-5 h-5 text-[#FF6B55] ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask NEXUS about your documents, warranties, deadlines, or personal context..."
                className="w-full bg-transparent px-3 py-2 text-sm text-[#F8F3E6] placeholder:text-[#6E6E80] focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded bg-[#FF6B55] text-[#0C0C10] text-xs font-mono font-bold tracking-wider uppercase hover:bg-[#FF816D] transition-colors flex items-center gap-1.5 shrink-0"
              >
                Execute
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Quick Prompts */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-mono text-[#6E6E80] mr-1">// SUGGESTED:</span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => router.push(`/conversation?q=${encodeURIComponent(prompt)}`)}
                className="text-xs font-mono px-3 py-1.5 rounded-full bg-[#181824] border border-[#2E2E40] text-[#D0D0E0] hover:border-[#FF6B55] hover:text-white transition-all text-left truncate max-w-xs"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Cards in Pixelate / Cobalt Layout ── */}
      <section className="px-8 py-12 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#22222E]">
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-[#FF6B55] uppercase">
              // ARCHITECTURE
            </span>
            <h2 className="text-2xl font-bold font-display text-[#F8F3E6] mt-1">
              CORE SYSTEM MODULES
            </h2>
          </div>
          <span className="text-xs font-mono text-[#6E6E80]">ALL SUBSYSTEMS ONLINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Electric Cobalt Brutalist */}
          <div className="cobalt-card rounded-lg p-6 flex flex-col justify-between relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-display font-black text-7xl text-white select-none">
              01
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#1E3A8A] font-bold">
                  VECTOR + FTS
                </span>
              </div>
              <h3 className="text-xl font-bold font-display text-white mb-2">
                Hybrid RAG Pipeline
              </h3>
              <p className="text-xs text-blue-100/80 leading-relaxed font-sans">
                Combines 1536-dimensional pgvector cosine search with PostgreSQL full-text search merged via Reciprocal Rank Fusion (RRF).
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-blue-400/20 flex items-center justify-between">
              <span className="text-[11px] font-mono text-blue-200">ms-marco reranker</span>
              <Link
                href="/knowledge"
                className="w-7 h-7 rounded bg-white/10 hover:bg-white text-white hover:text-[#1E3A8A] flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Proactive Intelligence (Terracotta / Dark) */}
          <div className="bg-[#14141E] border border-[#2E2E40] hover:border-[#FF6B55] rounded-lg p-6 flex flex-col justify-between transition-all group">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF6B55]/20 text-[#FF6B55] border border-[#FF6B55]/30 font-bold">
                  TEMPORAL
                </span>
              </div>
              <h3 className="text-xl font-bold font-display text-[#F8F3E6] mb-2 group-hover:text-[#FF6B55] transition-colors">
                Proactive Insights
              </h3>
              <p className="text-xs text-[#A0A0B0] leading-relaxed">
                Automatically scans for warranty expirations, auto insurance renewals, flight travel times, and academic deadlines without prompting.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#22222E] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#8E8E9B]">4 Active Alerts</span>
              <Link
                href="/insights"
                className="w-7 h-7 rounded bg-[#1F1F2C] hover:bg-[#FF6B55] text-[#A0A0B0] hover:text-[#0C0C10] flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Memory & Knowledge Graph */}
          <div className="bg-[#14141E] border border-[#2E2E40] hover:border-[#2563EB] rounded-lg p-6 flex flex-col justify-between transition-all group">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/30 font-bold">
                  GRAPH MEMORY
                </span>
              </div>
              <h3 className="text-xl font-bold font-display text-[#F8F3E6] mb-2 group-hover:text-[#60A5FA] transition-colors">
                Entity Knowledge Graph
              </h3>
              <p className="text-xs text-[#A0A0B0] leading-relaxed">
                Maintains structured memories of people, products, affiliations, and documents with non-negotiable provenance tracking.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#22222E] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#8E8E9B]">100% Provenance</span>
              <Link
                href="/conversation"
                className="w-7 h-7 rounded bg-[#1F1F2C] hover:bg-[#2563EB] text-[#A0A0B0] hover:text-white flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── System Specs Footer Strip ── */}
      <section className="px-8 max-w-5xl mx-auto w-full">
        <div className="p-4 rounded-lg bg-[#111118] border border-[#22222E] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#8E8E9B]">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-[#FF6B55]" />
            <span>PERSISTENCE: PostgreSQL 16 + pgvector</span>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <span>LLM: Grounded Generation with Prompt Injection Defense</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-[#10B981]" />
            <span>STATUS: 26 Commits Verified on GitHub</span>
          </div>
        </div>
      </section>
    </div>
  );
}
