"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  Bell,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Knowledge Base", href: "/knowledge", icon: FolderOpen },
  { name: "Chat", href: "/conversation", icon: MessageSquare },
  { name: "Insights & Deadlines", href: "/insights", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="flex flex-col w-60 border-r border-[#1C1C22] bg-[#0E0E12] shrink-0 select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-[#1C1C22] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-black font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white tracking-tight">
              NEXUS
            </span>
            <span className="block text-[11px] text-[#7A7A85] font-normal">
              Personal Context OS
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-[11px] font-medium text-[#5E5E6B] px-3 pb-2 pt-1 uppercase tracking-wider">
          Workspace
        </div>
        {navigation.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-[#1F1F28] text-white shadow-sm"
                  : "text-[#8E8E98] hover:text-white hover:bg-[#16161D]"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active ? "text-white" : "text-[#70707C]"
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-[#1C1C22] bg-[#0C0C10]">
        <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[#14141A] border border-[#1F1F26]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user?.name ? user.name[0] : "P"}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-white truncate">
                {user ? user.name : "Puneesh Gulati"}
              </p>
              <p className="text-[11px] text-[#70707C] truncate">
                {user ? user.email : "demo@nexus.local"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
