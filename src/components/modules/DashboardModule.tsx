"use client";

import { useMemo } from "react";
import {
  STUDENTS, TEACHERS, PARENTS, ALL_SECTIONS,
  NOTICES, ACTIVITY_FEED, TODAYS_CLASSES, UPCOMING_EXAMS, PENDING_ASSIGNMENTS,
  weeklyAttendanceTrend, classPerformanceBreakdown,
} from "@/data";
import { useAuth } from "@/store/AuthContext";
import { useAppNav } from "@/store/AppNavContext";
import { formatDate, timeAgo, round1 } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatCard, Card, Badge } from "@/components/ui/Primitives";
import { BarChart, DonutChart, ProgressRow } from "@/components/ui/Charts";

// =============================================================================
// DASHBOARD MODULE
// Content adapts by role: admin/principal see school-wide KPIs, teachers see
// class-focused widgets, students/parents see personal progress. All widgets
// pull from the shared mock data layer built in Phases 1-3.
// =============================================================================

export function DashboardModule() {
  const { session } = useAuth();
  const { setActiveModule } = useAppNav();
  if (!session) return null;
  const { role, name } = session.user;

  const avgAttendance = useMemo(
    () => round1(STUDENTS.reduce((sum, s) => sum + s.attendancePercentage, 0) / STUDENTS.length),
    []
  );

  const feedItems = ACTIVITY_FEED.slice(0, 6);
  const attendanceTrend = useMemo(() => weeklyAttendanceTrend(), []);
  const performanceBreakdown = useMemo(() => classPerformanceBreakdown(), []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            {greeting()}, {name.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">{formatDate(new Date().toISOString())} · Here&apos;s what&apos;s happening today.</p>
        </div>
        <QuickActions role={role} onNavigate={setActiveModule} />
      </div>

      {/* Stat cards — role aware */}
      {(role === "admin" || role === "principal") && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={STUDENTS.length.toLocaleString()} icon="users" accent="indigo" trend={{ value: 4.2, direction: "up" }} />
          <StatCard label="Total Teachers" value={TEACHERS.length} icon="briefcase" accent="sky" trend={{ value: 2.1, direction: "up" }} />
          <StatCard label="Avg. Attendance" value={`${avgAttendance}%`} icon="checkSquare" accent="emerald" trend={{ value: 1.4, direction: "up" }} />
          <StatCard label="Registered Parents" value={PARENTS.length} icon="userGroup" accent="amber" trend={{ value: 0.8, direction: "down" }} />
        </div>
      )}

      {role === "teacher" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="My Classes" value={ALL_SECTIONS.length > 0 ? 5 : 0} icon="layers" accent="indigo" />
          <StatCard label="My Students" value={142} icon="users" accent="sky" />
          <StatCard label="Pending Grading" value={PENDING_ASSIGNMENTS.length} icon="clipboard" accent="amber" />
          <StatCard label="Avg. Class Score" value="84%" icon="award" accent="emerald" trend={{ value: 3.2, direction: "up" }} />
        </div>
      )}

      {(role === "student" || role === "parent") && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Attendance" value="94%" icon="checkSquare" accent="emerald" />
          <StatCard label="Current GPA" value="3.6" icon="award" accent="indigo" />
          <StatCard label="Pending Homework" value={PENDING_ASSIGNMENTS.length} icon="bookOpen" accent="amber" />
          <StatCard label="Fee Status" value="Paid" icon="creditCard" accent="sky" />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: charts */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Weekly Attendance Trend" action={<Badge variant="success">This week</Badge>}>
            <BarChart data={attendanceTrend.map((d) => ({ label: d.day, value: d.percentage, color: "indigo" }))} />
          </Card>

          <Card title="Today's Classes">
            <div className="space-y-2">
              {TODAYS_CLASSES.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/[0.05]"
                >
                  <div className={`w-1 h-10 rounded-full bg-${c.subjectColor}-500 flex-shrink-0`} style={{ backgroundColor: subjectColorHex(c.subjectColor) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{c.subject}</p>
                    <p className="text-xs text-slate-500">{c.teacherOrClass} · {c.room}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium flex-shrink-0">{c.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Subject Performance">
            <div className="space-y-3.5">
              {performanceBreakdown.map((p) => (
                <ProgressRow key={p.subject} label={p.subject} value={p.average} color={p.color} />
              ))}
            </div>
          </Card>
        </div>

        {/* Right: activity, exams, notices */}
        <div className="space-y-5">
          <Card title="Recent Activity">
            <div className="space-y-4">
              {feedItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-slate-400 mt-0.5">
                    <Icon name={item.icon} size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-300 leading-snug">
                      <span className="font-medium text-white">{item.actor}</span> {item.action}{" "}
                      <span className="text-slate-400">{item.target}</span>
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(item.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Upcoming Exams" action={<Badge variant="warning">{UPCOMING_EXAMS.length} scheduled</Badge>}>
            <div className="space-y-2">
              {UPCOMING_EXAMS.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-xs font-medium text-white">{exam.subject}</p>
                    <p className="text-[11px] text-slate-500">{exam.classLabel}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{formatDate(exam.date)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Pinned Notices">
            <div className="space-y-3">
              {NOTICES.filter((n) => n.pinned).map((n) => (
                <div key={n.id} className="flex items-start gap-2.5">
                  <Icon name="pin" size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-white leading-snug">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{n.postedBy} · {timeAgo(n.postedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Class Composition">
            <DonutChart
              size={120}
              segments={[
                { label: "Active", value: STUDENTS.filter((s) => s.status === "active").length, colorHex: "#6366f1" },
                { label: "Inactive", value: STUDENTS.filter((s) => s.status !== "active").length, colorHex: "#334155" },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function subjectColorHex(color: string): string {
  const map: Record<string, string> = {
    sky: "#0ea5e9", violet: "#8b5cf6", amber: "#f59e0b", emerald: "#10b981",
    rose: "#f43f5e", cyan: "#06b6d4", orange: "#f97316", lime: "#84cc16",
    fuchsia: "#d946ef", teal: "#14b8a6", red: "#ef4444", pink: "#ec4899",
  };
  return map[color] ?? "#6366f1";
}

function QuickActions({ role, onNavigate }: { role: string; onNavigate: (m: import("@/types").ModuleKey) => void }) {
  const actions: { label: string; icon: IconName; module: import("@/types").ModuleKey }[] =
    role === "admin" || role === "principal"
      ? [
          { label: "Add Student", icon: "userPlus", module: "students" },
          { label: "Mark Attendance", icon: "checkSquare", module: "attendance" },
          { label: "New Notice", icon: "megaphone", module: "notices" },
        ]
      : role === "teacher"
      ? [
          { label: "Mark Attendance", icon: "checkSquare", module: "attendance" },
          { label: "Grade Homework", icon: "clipboard", module: "homework" },
          { label: "Create Quiz", icon: "helpCircle", module: "quizzes" },
        ]
      : [
          { label: "View Timetable", icon: "calendar", module: "timetable" },
          { label: "Continue Learning", icon: "graduationCap", module: "lms" },
        ];

  return (
    <div className="flex items-center gap-2">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => onNavigate(a.module)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-slate-300 hover:text-white transition-colors whitespace-nowrap"
        >
          <Icon name={a.icon} size={13} />
          {a.label}
        </button>
      ))}
    </div>
  );
}