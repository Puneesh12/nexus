import { Search, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-10 pt-16 pb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          NEXUS
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your personal context engine.
        </p>
      </div>

      {/* Search bar */}
      <div className="px-10 pb-12">
        <Link
          href="/conversation"
          className="flex items-center gap-3 w-full max-w-2xl px-4 py-3 rounded-lg border border-border bg-card text-muted-foreground hover:border-ring hover:text-foreground transition-colors shadow-sm"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="text-sm">Ask anything about your information…</span>
        </Link>
      </div>

      {/* Quick links */}
      <div className="px-10 grid grid-cols-3 gap-4 max-w-2xl">
        {[
          {
            label: "Knowledge",
            description: "Upload and manage documents",
            href: "/knowledge",
          },
          {
            label: "Insights",
            description: "Upcoming deadlines and events",
            href: "/insights",
          },
          {
            label: "Ask NEXUS",
            description: "Query your personal context",
            href: "/conversation",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col gap-1 p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {item.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed">
              {item.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
