"use client";

import { useEffect, useState } from "react";
import {
  Lightbulb,
  Calendar,
  AlertTriangle,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

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
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/insights");
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
    <div className="px-10 py-10 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
        Insights
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Upcoming deadlines, expiring items, and important events detected from your personal context.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : insights.length === 0 ? (
        <>
          {/* Empty state */}
          <div className="rounded-lg border border-dashed border-border bg-card px-8 py-12 text-center">
            <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">
              No active alerts or deadlines
            </p>
            <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
              Upload documents in the Knowledge section. NEXUS will automatically detect deadlines,
              expiration dates, and important events.
            </p>
          </div>

          <div className="mt-8">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
              What NEXUS detects automatically
            </p>
            <div className="space-y-2">
              {[
                { icon: AlertTriangle, label: "Expiration dates — warranties, subscriptions, insurance" },
                { icon: Calendar, label: "Upcoming deadlines — submissions, payments, renewals" },
                { icon: Lightbulb, label: "Action items — obligations detected from documents" },
              ].map(({ icon: Icon, label }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-md border border-border bg-card"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {insights.map((item) => {
            const isDone = acknowledged[item.id];
            return (
              <div
                key={item.id}
                className="p-5 rounded-lg border border-border bg-card flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        item.importance >= 0.85
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.date}
                    </span>
                  </div>
                  {item.source_filename && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[180px]">
                        {item.source_filename}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.recommended_action && (
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Recommended: <strong className="font-medium text-foreground">{item.recommended_action}</strong>
                    </span>
                    <button
                      onClick={() => handleAction(item.id)}
                      disabled={isDone}
                      className="text-xs font-medium px-2.5 py-1 rounded bg-accent text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
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
