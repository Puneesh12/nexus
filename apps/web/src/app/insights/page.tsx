"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
  Loader2,
  Check,
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
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Overdue" | "Completed">("Upcoming");

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

  return (
    <div className="min-h-full chronotask-canvas text-[#1F2937] p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            My Tasks &amp; Goals
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Automated obligations, renewals, and deadlines tracked from your files.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs text-xs font-semibold">
          {(["Upcoming", "Overdue", "Completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#6B7280] flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
          <span>Scanning upcoming obligations...</span>
        </div>
      ) : insights.length === 0 ? (
        <div className="card-chronotask p-12 text-center max-w-md mx-auto">
          <Bell className="w-8 h-8 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#111827] mb-1">
            No deadlines found
          </h3>
          <p className="text-xs text-[#6B7280]">
            Upload your warranty certificates, policies, or flight tickets in the Knowledge section to populate reminders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((item, idx) => {
            const isDone = acknowledged[item.id];
            const priorityBadgeNum = 8 - (idx % 3);

            return (
              <div
                key={item.id}
                className="card-chronotask p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#2563EB] text-white text-[11px] font-bold flex items-center justify-center">
                        {priorityBadgeNum}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#F3F4F6] text-[#4B5563]">
                        {item.type}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-[#6B7280] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      {item.date}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#111827] mb-1.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {item.source_filename && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] text-[#4B5563] font-medium mb-4">
                      <FileText className="w-3 h-3 text-[#2563EB]" />
                      <span className="truncate max-w-[220px]">{item.source_filename}</span>
                    </div>
                  )}
                </div>

                {item.recommended_action && (
                  <div className="pt-4 border-t border-[#F3F4F6] flex items-center justify-between gap-3">
                    <div className="text-xs text-[#4B5563] truncate">
                      <span className="font-semibold text-[#111827]">Action: </span>
                      <span>{item.recommended_action}</span>
                    </div>
                    <button
                      onClick={() => handleAction(item.id)}
                      disabled={isDone}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                        isDone
                          ? "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                          : "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-xs"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Done
                        </>
                      ) : (
                        <>
                          Complete
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
