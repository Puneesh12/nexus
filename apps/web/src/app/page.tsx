"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Search,
  Bell,
  Sparkles,
  Play,
  Pause,
  Square,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  Video,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user } = useAuth();

  // Time Tracker state
  const [seconds, setSeconds] = useState(15718); // 04:21:58
  const [timerRunning, setTimerRunning] = useState(true);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Interactive Checklist
  const [todos, setTodos] = useState([
    {
      id: 1,
      text: "Finish the sales presentation 🔥 for the client meeting at 2:00 PM",
      completed: false,
    },
    {
      id: 2,
      text: "Send follow-up emails to potential leads",
      completed: true,
    },
    {
      id: 3,
      text: "Review and approve the marketing budget 📅",
      completed: false,
    },
    {
      id: 4,
      text: "Take 10 minutes for meditation or deep breathing",
      completed: true,
    },
  ]);

  const toggleTodo = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Activity filter toggle
  const [activityMode, setActivityMode] = useState<"weekly" | "daily">("weekly");
  const [assignedTab, setAssignedTab] = useState<"Upcoming" | "Overdue" | "Completed">("Upcoming");

  return (
    <div className="min-h-full chronotask-canvas text-[#1F2937] p-8 max-w-7xl mx-auto">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between pb-6 mb-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2 text-sm font-semibold text-[#4B5563] bg-white px-3.5 py-1.5 rounded-xl border border-[#E5E7EB] shadow-2xs cursor-pointer hover:bg-[#F9FAFB]">
          <CalendarIcon className="w-4 h-4 text-[#6B7280]" />
          <span>Monday, September 30</span>
          <span className="text-xs text-[#9CA3AF]">⇕</span>
        </div>

        {/* Action icons & Customize */}
        <div className="flex items-center gap-3">
          <Link
            href="/conversation"
            className="p-2 rounded-xl bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors shadow-2xs"
          >
            <Search className="w-4 h-4" />
          </Link>
          <Link
            href="/insights"
            className="relative p-2 rounded-xl bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors shadow-2xs"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444]"></span>
          </Link>
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&auto=format&fit=crop&crop=face"
            alt="Amanda P."
            className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]"
          />
          <button className="flex items-center gap-1.5 text-xs font-semibold text-[#374151] bg-white border border-[#E5E7EB] px-3.5 py-2 rounded-xl hover:bg-[#F9FAFB] shadow-2xs">
            <span>Customize</span>
            <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
          </button>
        </div>
      </div>

      {/* ── Greeting ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
          Good morning, {user?.name ? user.name.split(" ")[0] : "Amanda"}
        </h1>
      </div>

      {/* ── Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Card 1: To Do List (Left Column, span 6) ── */}
        <div className="lg:col-span-6 card-chronotask p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <h2 className="text-xl font-bold text-[#111827]">To do list</h2>
              </div>
            </div>

            <button
              onClick={() => {
                const text = prompt("Enter new task:");
                if (text) {
                  setTodos((prev) => [
                    ...prev,
                    { id: Date.now(), text, completed: false },
                  ]);
                }
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827] mb-4 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create new</span>
            </button>

            <div className="space-y-4">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => toggleTodo(todo.id)}
                  className="flex items-start gap-3 cursor-pointer group select-none"
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 mt-0.5 border ${
                      todo.completed
                        ? "bg-[#2563EB] border-[#2563EB] text-white"
                        : "border-[#D1D5DB] bg-white group-hover:border-[#9CA3AF]"
                    }`}
                  >
                    {todo.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-sm leading-relaxed transition-all ${
                      todo.completed
                        ? "line-through text-[#9CA3AF]"
                        : "text-[#374151] group-hover:text-[#111827]"
                    }`}
                  >
                    {todo.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Reminder Pill */}
          <div className="mt-8 pt-4 border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#111827]">Reminder</span>
              <div className="flex items-center gap-1 text-[#9CA3AF]">
                <button className="p-1 rounded hover:bg-[#F3F4F6]">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 rounded hover:bg-[#F3F4F6]">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#F1F3F5] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#111827]">Today's Meeting</p>
                <p className="text-[11px] text-[#6B7280]">Call with marketing team · 13:00 - 13:45</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#EBF5FF] flex items-center justify-center text-[#2563EB]">
                <Video className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Time Tracker + Activity Rings + Assigned Tasks (span 6) ── */}
        <div className="lg:col-span-6 space-y-6">
          {/* Top Half: Time tracker + Activity Rings in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Time Tracker */}
            <div className="card-chronotask p-6 flex flex-col justify-between items-center text-center">
              <div className="w-full flex items-center justify-between text-xs text-[#6B7280] font-semibold mb-2">
                <span>Time tracker</span>
                <MoreVertical className="w-4 h-4 text-[#9CA3AF] cursor-pointer" />
              </div>

              <div className="my-6">
                <div className="text-3xl font-extrabold text-[#111827] tracking-tight font-mono">
                  {formatTimer(seconds)}
                </div>
              </div>

              {/* Pause and Stop Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="w-10 h-10 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#374151] hover:bg-[#F3F4F6] transition-colors shadow-2xs"
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setSeconds(0);
                  }}
                  className="w-10 h-10 rounded-full bg-[#EA580C] text-white flex items-center justify-center hover:bg-[#C2410C] transition-colors shadow-sm"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>

            {/* Activity Rings */}
            <div className="card-chronotask p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#111827]">Activity</span>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() => setActivityMode("weekly")}
                    className={`font-semibold ${
                      activityMode === "weekly" ? "text-[#2563EB]" : "text-[#9CA3AF]"
                    }`}
                  >
                    weekly
                  </button>
                  <button
                    onClick={() => setActivityMode("daily")}
                    className={`font-semibold ${
                      activityMode === "daily" ? "text-[#2563EB]" : "text-[#9CA3AF]"
                    }`}
                  >
                    daily
                  </button>
                </div>
              </div>

              {/* Rings + Stats Layout */}
              <div className="flex items-center justify-between gap-2 my-2">
                {/* Text Stats */}
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#F59E0B]">
                      <span className="w-1 h-3 rounded-full bg-[#F59E0B] inline-block"></span>
                      <span className="text-[10px] text-[#6B7280]">Working hours</span>
                    </div>
                    <p className="text-base font-bold text-[#111827] ml-2.5">29/40</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[#06B6D4]">
                      <span className="w-1 h-3 rounded-full bg-[#06B6D4] inline-block"></span>
                      <span className="text-[10px] text-[#6B7280]">Tasks completed</span>
                    </div>
                    <p className="text-base font-bold text-[#111827] ml-2.5">8/12</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[#2563EB]">
                      <span className="w-1 h-3 rounded-full bg-[#2563EB] inline-block"></span>
                      <span className="text-[10px] text-[#6B7280]">Projects completed</span>
                    </div>
                    <p className="text-base font-bold text-[#111827] ml-2.5">4/7</p>
                  </div>
                </div>

                {/* SVG Radial Multi-Rings */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    {/* Outer Ring (Orange) */}
                    <circle cx="50" cy="50" r="42" stroke="#FEF3C7" strokeWidth="6" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="#F59E0B"
                      strokeWidth="6"
                      strokeDasharray="264"
                      strokeDashoffset="70"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {/* Middle Ring (Cyan) */}
                    <circle cx="50" cy="50" r="32" stroke="#CFFAFE" strokeWidth="6" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="32"
                      stroke="#06B6D4"
                      strokeWidth="6"
                      strokeDasharray="201"
                      strokeDashoffset="60"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {/* Inner Ring (Blue) */}
                    <circle cx="50" cy="50" r="22" stroke="#DBEAFE" strokeWidth="6" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="22"
                      stroke="#2563EB"
                      strokeWidth="6"
                      strokeDasharray="138"
                      strokeDashoffset="55"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>

              {/* Dots navigation */}
              <div className="flex justify-center gap-1 mt-2">
                <span className="w-4 h-1 rounded-full bg-[#111827]"></span>
                <span className="w-1.5 h-1 rounded-full bg-[#E5E7EB]"></span>
              </div>
            </div>
          </div>

          {/* ── Tasks I've assigned ── */}
          <div className="card-chronotask p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F3F4F6]">
              <h2 className="text-sm font-bold text-[#111827]">Tasks I've assigned</h2>
              <button className="p-1 rounded-md hover:bg-[#F3F4F6] text-[#6B7280]">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-4 text-xs font-semibold pb-3 mb-4 border-b border-[#F3F4F6]">
              {(["Upcoming", "Overdue", "Completed"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAssignedTab(tab)}
                  className={`pb-1 transition-colors relative ${
                    assignedTab === tab ? "text-[#2563EB]" : "text-[#9CA3AF] hover:text-[#4B5563]"
                  }`}
                >
                  {tab}
                  {assignedTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Tasks List */}
            <div className="space-y-3.5">
              {/* Row 1 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded bg-[#EF4444] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    8
                  </span>
                  <span className="text-xs font-semibold text-[#1F2937] truncate">
                    New Ideas for campaign
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#06B6D4] h-full rounded-full w-[60%]"></div>
                  </div>
                  <span className="text-xs font-semibold text-[#6B7280] w-8 text-right">60%</span>
                  <div className="flex -space-x-1.5">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&auto=format&fit=crop&crop=face"
                      className="w-5 h-5 rounded-full border border-white"
                      alt=""
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&auto=format&fit=crop&crop=face"
                      className="w-5 h-5 rounded-full border border-white"
                      alt=""
                    />
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded bg-[#F59E0B] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    7
                  </span>
                  <span className="text-xs font-semibold text-[#1F2937] truncate">
                    Change button
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#06B6D4] h-full rounded-full w-[27%]"></div>
                  </div>
                  <span className="text-xs font-semibold text-[#6B7280] w-8 text-right">27%</span>
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&auto=format&fit=crop&crop=face"
                    className="w-5 h-5 rounded-full border border-white"
                    alt=""
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded bg-[#EAB308] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    6
                  </span>
                  <span className="text-xs font-semibold text-[#1F2937] truncate">
                    New BrandBook
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#06B6D4] h-full rounded-full w-[95%]"></div>
                  </div>
                  <span className="text-xs font-semibold text-[#6B7280] w-8 text-right">95%</span>
                  <div className="flex -space-x-1.5">
                    <img
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&auto=format&fit=crop&crop=face"
                      className="w-5 h-5 rounded-full border border-white"
                      alt=""
                    />
                    <img
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&auto=format&fit=crop&crop=face"
                      className="w-5 h-5 rounded-full border border-white"
                      alt=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
