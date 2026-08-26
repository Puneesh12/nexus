"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  FileCode,
  Terminal,
  Activity,
  UserCheck,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navigation = [
  { name: "OVERVIEW", code: "00", href: "/", icon: Layers },
  { name: "KNOWLEDGE", code: "01", href: "/knowledge", icon: FileCode },
  { name: "CONVERSATION", code: "02", href: "/conversation", icon: Terminal },
  { name: "INSIGHTS", code: "03", href: "/insights", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="flex flex-col w-64 border-r border-[#22222B] bg-[#0E0E14] shrink-0 font-mono select-none">
      {/* Brand Header */}
      <div className="px-5 py-6 border-b border-[#22222B] bg-[#12121A]/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-[#FF6B55] flex items-center justify-center text-[#0C0C10] font-black text-xs">
              N
            </div>
            <span className="text-base font-extrabold tracking-widest text-[#F8F3E6] font-display">
              NEXUS
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22222E] text-[#FF6B55] font-bold tracking-wider">
            v0.1
          </span>
        </div>
        <p className="text-[11px] text-[#8E8E9B] mt-1.5 tracking-tight">
          CONTEXT & RAG OPERATING SYSTEM
        </p>
      </div>

      {/* System Status Pill */}
      <div className="px-4 py-3 border-b border-[#22222B] bg-[#09090C]/90 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-[#A0A0B0]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </span>
          <span>PGVECTOR READY</span>
        </div>
        <Cpu className="w-3.5 h-3.5 text-[#606070]" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5">
        <div className="text-[10px] text-[#606070] px-3 pb-1 tracking-widest font-bold">
          // NAVIGATION
        </div>
        {navigation.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3.5 py-2.5 rounded text-xs transition-all duration-150",
                active
                  ? "bg-[#FF6B55] text-[#0C0C10] font-bold shadow-[2px_2px_0px_#FFFFFF]"
                  : "text-[#B0B0C0] hover:text-[#FFFFFF] hover:bg-[#181822] hover:translate-x-0.5"
              )}
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    active ? "text-[#0C0C10]" : "text-[#707080] group-hover:text-[#FF6B55]"
                  )}
                />
                <span className="tracking-wider">{item.name}</span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-mono",
                  active ? "text-[#0C0C10]/80 font-bold" : "text-[#505060]"
                )}
              >
                [{item.code}]
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-[#22222B] bg-[#12121A]/60">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded bg-[#09090C] border border-[#22222B]">
          <div className="w-6 h-6 rounded bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold">
            P
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#F8F3E6] truncate">
              {user ? user.name : "Puneesh Gulati"}
            </p>
            <p className="text-[10px] text-[#10B981] flex items-center gap-1 truncate">
              <UserCheck className="w-2.5 h-2.5" />
              AUTHENTICATED
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
