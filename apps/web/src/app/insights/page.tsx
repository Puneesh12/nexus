import { Lightbulb, Calendar, AlertTriangle } from "lucide-react";

export default function InsightsPage() {
  return (
    <div className="px-10 py-10 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Insights</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Upcoming deadlines, expiring items, and important events detected from your documents.
      </p>

      {/* Empty state — honest, no fake data */}
      <div className="rounded-lg border border-dashed border-border bg-card px-8 py-12 text-center">
        <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">
          No insights yet
        </p>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
          Upload documents in the Knowledge section. NEXUS will automatically detect deadlines,
          expiration dates, and important events.
        </p>
      </div>

      {/* Planned insight types — for transparency */}
      <div className="mt-8">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
          What NEXUS will detect
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
    </div>
  );
}
