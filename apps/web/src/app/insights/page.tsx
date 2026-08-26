"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Calendar,
  AlertTriangle,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Filter,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface InsightItem {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  importance: number;
  source_filename?: string;
  recommended_action?: string;
}

export default function InsightsPage() {
  const { ensureAuth } = useAuth();
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchInsights() {
      try {
        const token = await ensureAuth();
        if (!token) return;

        const res = await fetch("/api/insights", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setInsights(data.insights || []);
        }
      } catch (err) {
        console.error("Failed to load insights", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  const handleAction = (id: string) => {
    setAcknowledged((prev) => ({ ...prev, [id]: true }));
  };

  const filteredInsights = insights.filter((item) => {
    if (activeFilter === "ALL") return true;
    return item.type.toUpperCase() === activeFilter;
  });

  return (
    <div className="min-h-full bg-[#0C0C10] text-[#F8F3E6] font-sans px-6 sm:px-12 py-10 max-w-5xl mx-auto">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#22222E] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold tracking-widest text-[#FF6B55] uppercase">
              // PROACTIVE INTELLIGENCE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-[#F8F3E6]">
            PROACTIVE INSIGHTS
          </h1>
          <p className="text-xs text-[#8E8E9B] mt-1 font-mono">
            AUTOMATICALLY EXTRACTED COMMITMENTS, DEADLINES, AND EXPIRATIONS
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#14141E] border border-[#22222E] self-start sm:self-auto font-mono text-xs">
          {["ALL", "EXPIRATION", "RENEWAL", "SUBMISSION", "TRAVEL"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded transition-all ${
                activeFilter === filter
                  ? "bg-[#FF6B55] text-[#0C0C10] font-bold shadow-sm"
                  : "text-[#8E8E9B] hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-[#FF6B55] animate-spin" />
          <span className="text-xs font-mono text-[#8E8E9B]">
            Scanning memory and temporal events...
          </span>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="p-12 rounded-lg border-2 border-dashed border-[#22222E] bg-[#14141E] text-center max-w-lg mx-auto">
          <Activity className="w-10 h-10 text-[#FF6B55] mx-auto mb-4" />
          <h3 className="text-base font-bold font-display text-[#F8F3E6] mb-1">
            No Active Events in Selected Filter
          </h3>
          <p className="text-xs text-[#8E8E9B] leading-relaxed mb-6 font-sans">
            Upload new documents in the Knowledge section to automatically extract warranty expirations, travel schedules, and obligations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInsights.map((item) => {
            const isDone = acknowledged[item.id];
            const isHighPriority = item.importance >= 0.85;

            return (
              <div
                key={item.id}
                className={`p-6 rounded-lg border transition-all flex flex-col justify-between ${
                  isHighPriority
                    ? "bg-[#14141E] border-[#333344] hover:border-[#FF6B55] shadow-[3px_3px_0px_rgba(255,107,85,0.2)]"
                    : "bg-[#14141E] border-[#252535] hover:border-[#2563EB]"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 font-mono">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isHighPriority
                            ? "bg-[#FF6B55] text-[#0C0C10]"
                            : "bg-[#2563EB] text-white"
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-xs text-[#8E8E9B] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F1F2E] text-[#10B981] font-bold">
                      {Math.round(item.importance * 100)}% PRIORITY
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold font-display text-[#F8F3E6] mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#A0A0B0] leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {/* Source Document Tag */}
                  {item.source_filename && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#09090C] border border-[#22222E] text-[11px] font-mono text-[#8E8E9B] mb-4">
                      <FileText className="w-3 h-3 text-[#FF6B55]" />
                      <span className="truncate max-w-[220px]">{item.source_filename}</span>
                    </div>
                  )}
                </div>

                {/* Recommended Action Footer */}
                {item.recommended_action && (
                  <div className="pt-3 border-t border-[#22222E] flex items-center justify-between gap-3">
                    <div className="text-[11px] text-[#A0A0B0] font-sans truncate">
                      <span className="font-mono text-[#6E6E80] mr-1">ACTION:</span>
                      <strong className="text-[#F8F3E6] font-medium">{item.recommended_action}</strong>
                    </div>
                    <button
                      onClick={() => handleAction(item.id)}
                      disabled={isDone}
                      className={`text-xs font-mono px-3 py-1.5 rounded flex items-center gap-1.5 transition-all shrink-0 ${
                        isDone
                          ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-bold"
                          : "bg-[#FF6B55] text-[#0C0C10] hover:bg-[#FF816D] font-bold shadow-[2px_2px_0px_#FFFFFF]"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Handled
                        </>
                      ) : (
                        <>
                          Action
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
