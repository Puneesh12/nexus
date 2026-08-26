"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  AlertTriangle,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
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
    <div className="min-h-full bg-[#0A0A0D] text-[#EDEDED] px-8 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#1C1C22] gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Insights &amp; Deadlines
          </h1>
          <p className="text-sm text-[#8E8E98] mt-0.5">
            Automated alerts extracted from your warranties, policies, and tickets.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14141A] border border-[#22222B] self-start sm:self-auto text-xs">
          {["ALL", "EXPIRATION", "RENEWAL", "SUBMISSION", "TRAVEL"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeFilter === filter
                  ? "bg-white text-black shadow-sm"
                  : "text-[#8E8E98] hover:text-white"
              }`}
            >
              {filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2.5">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
          <span className="text-xs text-[#70707C]">Scanning upcoming events...</span>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="p-12 rounded-xl border border-[#1E1E26] bg-[#121217] text-center max-w-md mx-auto">
          <Bell className="w-8 h-8 text-[#70707C] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-white mb-1">
            No events found in this category
          </h3>
          <p className="text-xs text-[#70707C]">
            Upload new documents to extract deadlines and upcoming reminders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsights.map((item) => {
            const isDone = acknowledged[item.id];
            const isHighPriority = item.importance >= 0.85;

            return (
              <div
                key={item.id}
                className="p-5 rounded-xl border border-[#1E1E26] bg-[#121217] hover:border-[#2C2C38] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Meta */}
                  <div className="flex items-center justify-between gap-3 mb-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        isHighPriority
                          ? "bg-red-500/15 text-red-400"
                          : "bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </span>

                    <span className="text-xs text-[#8E8E98] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.date}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-semibold text-white mb-1.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#8E8E98] leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {/* Source Document */}
                  {item.source_filename && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0C0C10] border border-[#1E1E26] text-[11px] text-[#70707C] mb-4">
                      <FileText className="w-3 h-3 text-[#A0A0AB]" />
                      <span className="truncate max-w-[220px]">{item.source_filename}</span>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                {item.recommended_action && (
                  <div className="pt-3 border-t border-[#1C1C22] flex items-center justify-between gap-2">
                    <div className="text-xs text-[#8E8E98] truncate">
                      <span className="text-[#5E5E6B] mr-1">Action:</span>
                      <span className="text-[#EDEDED]">{item.recommended_action}</span>
                    </div>
                    <button
                      onClick={() => handleAction(item.id)}
                      disabled={isDone}
                      className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 font-medium ${
                        isDone
                          ? "bg-[#10B981]/15 text-[#10B981]"
                          : "bg-white text-black hover:bg-[#E5E5E5]"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done
                        </>
                      ) : (
                        <>
                          Action
                          <ArrowRight className="w-3.5 h-3.5" />
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
