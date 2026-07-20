"use client";

import { useMemo, useState } from "react";
import type { AttendanceMark } from "@/types";
import { CLASSES, ALL_SECTIONS, getClassById } from "@/data";
import { useAttendance, ATTENDANCE_MARK_CONFIG } from "@/hooks/useAttendance";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/store/ToastContext";
import { matchesSearch, formatDate } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Input";
import { Badge, Card } from "@/components/ui/Primitives";
import { AttendanceMarkToggle } from "./AttendanceMarkToggle";

// =============================================================================
// ATTENDANCE MODULE
// Two tabs: "Mark Attendance" (daily register for a chosen section+date, with
// bulk actions) and "Summary" (per-student attendance % for the selected
// section, sourced from all recorded history). No pagination here — a
// section register is at most ~35 rows, small enough to show in full.
// =============================================================================

type Tab = "mark" | "summary";

const TODAY = "2026-07-19";

export function AttendanceModule() {
  const { session } = useAuth();
  const toast = useToast();
  const { getRosterForSection, getRegisterForDate, saveRegister, isSaving, getStudentAttendancePercentage } = useAttendance();

  const [tab, setTab] = useState<Tab>("mark");
  const [classId, setClassId] = useState(CLASSES[0]?.id ?? "");
  const [sectionId, setSectionId] = useState(ALL_SECTIONS.find((s) => s.classId === CLASSES[0]?.id)?.id ?? "");
  const [date, setDate] = useState(TODAY);
  const [search, setSearch] = useState("");
  const [pendingMarks, setPendingMarks] = useState<Record<string, AttendanceMark> | null>(null);

  const availableSections = ALL_SECTIONS.filter((s) => s.classId === classId);
  const roster = useMemo(() => getRosterForSection(sectionId, classId), [getRosterForSection, sectionId, classId]);
  const savedRegister = useMemo(() => getRegisterForDate(sectionId, date), [getRegisterForDate, sectionId, date]);

  // pendingMarks lets the user toggle marks locally before hitting Save, falling
  // back to whatever's already saved for this section+date.
  const marks = pendingMarks ?? savedRegister;

  const filteredRoster = roster.filter((s) => matchesSearch(`${s.firstName} ${s.lastName}`, search));

  const summary = {
    present: roster.filter((s) => marks[s.id] === "present").length,
    absent: roster.filter((s) => marks[s.id] === "absent").length,
    late: roster.filter((s) => marks[s.id] === "late").length,
    leave: roster.filter((s) => marks[s.id] === "leave").length,
    unmarked: roster.filter((s) => !marks[s.id]).length,
  };

  function setMark(studentId: string, mark: AttendanceMark) {
    setPendingMarks({ ...marks, [studentId]: mark });
  }

  function markAllPresent() {
    const next: Record<string, AttendanceMark> = { ...marks };
    roster.forEach((s) => {
      next[s.id] = "present";
    });
    setPendingMarks(next);
  }

  async function handleSave() {
    if (!session) return;
    await saveRegister({ sectionId, classId, date, marks, markedBy: session.user.id });
    setPendingMarks(null);
    toast.success("Attendance saved", `${formatDate(date)} register recorded for ${roster.length} students.`);
  }

  const hasUnsavedChanges = pendingMarks !== null;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Attendance</h2>
          <p className="text-sm text-slate-400 mt-0.5">Mark daily attendance and review historical trends</p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
          <TabButton active={tab === "mark"} onClick={() => setTab("mark")} label="Mark Attendance" />
          <TabButton active={tab === "summary"} onClick={() => setTab("summary")} label="Summary" />
        </div>
      </div>

      {/* Selectors */}
      <Card className="!p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <Select
            value={classId}
            onChange={(v) => {
              setClassId(v);
              const firstSection = ALL_SECTIONS.find((s) => s.classId === v);
              setSectionId(firstSection?.id ?? "");
              setPendingMarks(null);
            }}
            options={CLASSES.map((c) => ({ value: c.id, label: c.name }))}
            className="lg:w-48"
          />
          <Select
            value={sectionId}
            onChange={(v) => {
              setSectionId(v);
              setPendingMarks(null);
            }}
            options={availableSections.map((s) => ({ value: s.id, label: `Section ${s.name}` }))}
            className="lg:w-40"
          />
          {tab === "mark" && (
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPendingMarks(null);
              }}
              className="lg:w-44"
            />
          )}
          <div className="relative flex-1">
            <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/[0.07] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
        </div>
      </Card>

      {tab === "mark" ? (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <SummaryChip label="Present" value={summary.present} variant="success" />
            <SummaryChip label="Absent" value={summary.absent} variant="error" />
            <SummaryChip label="Late" value={summary.late} variant="warning" />
            <SummaryChip label="Leave" value={summary.leave} variant="info" />
            <SummaryChip label="Unmarked" value={summary.unmarked} variant="neutral" />
          </div>

          {/* Register */}
          <Card
            className="!p-0 overflow-hidden"
            title={undefined}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-sm font-semibold text-white">
                  {getClassById(classId)?.name} · Section {availableSections.find((s) => s.id === sectionId)?.name}
                </p>
                <p className="text-xs text-slate-500">{formatDate(date)} · {roster.length} students</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" icon="checkSquare" onClick={markAllPresent}>
                  Mark all present
                </Button>
                <Button size="sm" icon="check" onClick={handleSave} loading={isSaving} disabled={!hasUnsavedChanges}>
                  Save register
                </Button>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {filteredRoster.map((student) => (
                <div key={student.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${student.avatarColor} flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0`}>
                    {student.avatarInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-slate-500">Roll #{student.rollNumber}</p>
                  </div>
                  <AttendanceMarkToggle value={marks[student.id]} onChange={(mark) => setMark(student.id, mark)} />
                </div>
              ))}
              {filteredRoster.length === 0 && (
                <div className="px-5 py-16 text-center">
                  <Icon name="users" size={28} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    {roster.length === 0 ? "No students enrolled in this section." : "No students match your search."}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance %</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((student) => {
                  const pct = getStudentAttendancePercentage(student.id);
                  const displayPct = pct || student.attendancePercentage; // fall back to seed value if no marks recorded yet
                  return (
                    <tr key={student.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${student.avatarColor} flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0`}>
                            {student.avatarInitials}
                          </div>
                          <span className="font-medium text-white">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={displayPct >= 90 ? "success" : displayPct >= 75 ? "warning" : "error"}>{Math.round(displayPct)}%</Badge>
                      </td>
                      <td className="px-4 py-3 w-64">
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${displayPct >= 90 ? "bg-emerald-500" : displayPct >= 75 ? "bg-amber-500" : "bg-rose-500"}`}
                            style={{ width: `${Math.min(displayPct, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRoster.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-16 text-center text-sm text-slate-500">
                      No students to show.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function SummaryChip({ label, value, variant }: { label: string; value: number; variant: "success" | "error" | "warning" | "info" | "neutral" }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5 text-center">
      <p className="text-xl font-semibold text-white">{value}</p>
      <Badge variant={variant} className="mt-1.5">
        {label}
      </Badge>
    </div>
  );
}

void ATTENDANCE_MARK_CONFIG; // referenced for type consistency across the module set