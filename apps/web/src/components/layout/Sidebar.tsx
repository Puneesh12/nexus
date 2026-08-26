"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CheckSquare,
  Inbox,
  BarChart2,
  Folder,
  Target,
  Plus,
  ChevronsLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const mainNav = [
  { name: "Home", href: "/", icon: Home },
  { name: "My Tasks", href: "/insights", icon: CheckSquare, badge: "22" },
  { name: "Inbox", href: "/conversation", icon: Inbox, badge: "15" },
  { name: "Reporting", href: "/knowledge", icon: BarChart2 },
  { name: "Portfolios", href: "/knowledge", icon: Folder },
  { name: "Goals", href: "/insights", icon: Target, badge: "8" },
];

const workspaces = [
  { name: "Personal Context", emoji: "🧠", href: "/knowledge" },
  { name: "Warranties & Policies", emoji: "📑", href: "/insights" },
  { name: "Travel & Itineraries", emoji: "✈️", href: "/insights" },
  { name: "Academic & Research", emoji: "🎓", href: "/knowledge" },
  { name: "Team Brainstorm", emoji: "🚀", href: "/conversation" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="flex flex-col w-64 border-r border-[#E5E7EB] bg-[#FFFFFF] shrink-0 select-none text-[#1F2937]">
      {/* Brand Header */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-[#F1F3F5]">
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* ChronoTask 4-dot icon */}
          <div className="grid grid-cols-2 gap-1 w-5 h-5">
            <span className="w-2 h-2 rounded-full bg-[#1F2937]"></span>
            <span className="w-2 h-2 rounded-full bg-[#1F2937]"></span>
            <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
            <span className="w-2 h-2 rounded-full bg-[#1F2937]"></span>
          </div>
          <span className="text-base font-bold text-[#111827] tracking-tight">
            ChronoTask
          </span>
        </Link>
        <button className="text-[#9CA3AF] hover:text-[#4B5563] p-1 rounded-md hover:bg-[#F3F4F6] transition-colors">
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>

      {/* + Create Button */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/knowledge"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] text-sm font-semibold text-[#1F2937] transition-all shadow-xs"
        >
          <Plus className="w-4 h-4 text-[#4B5563]" />
          <span>Create</span>
        </Link>
      </div>

      {/* General Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div>
          <div className="text-[11px] font-semibold text-[#9CA3AF] px-3 pb-2 uppercase tracking-wider">
            General
          </div>
          <nav className="space-y-0.5">
            {mainNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-[#F3F4F6] text-[#111827] font-semibold"
                      : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        active ? "text-[#111827]" : "text-[#9CA3AF]"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs font-semibold text-[#6B7280]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* My Workspace Section */}
        <div>
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              My Workspace
            </span>
            <button className="text-[#9CA3AF] hover:text-[#4B5563]">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {workspaces.map((ws, i) => (
              <Link
                key={i}
                href={ws.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors truncate"
              >
                <span className="text-sm">{ws.emoji}</span>
                <span className="truncate">{ws.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[#F1F3F5] bg-[#FAFAFC]">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&auto=format&fit=crop&crop=face"
            alt="User"
            className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#111827] truncate">
              {user?.name || "Amanda P."}
            </p>
            <p className="text-[11px] text-[#9CA3AF] truncate">
              {user?.email || "amanda@chronotask.app"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
