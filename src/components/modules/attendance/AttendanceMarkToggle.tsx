"use client";

import type { AttendanceMark } from "@/types";
import { ATTENDANCE_MARK_CONFIG } from "@/hooks/useAttendance";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

// =============================================================================
// ATTENDANCE MARK TOGGLE
// Four-way segmented control (Present/Absent/Late/Leave) for one student row
// in the daily register. Deliberately large tap targets — this gets clicked
// dozens of times per section when marking a full class.
// =============================================================================

const MARK_ICONS: Record<AttendanceMark, "check" | "x" | "clock" | "flag"> = {
  present: "check",
  absent: "x",
  late: "clock",
  leave: "flag",
};

const ACTIVE_STYLES: Record<AttendanceMark, string> = {
  present: "bg-emerald-500/20 border-emerald-400/50 text-emerald-300",
  absent: "bg-rose-500/20 border-rose-400/50 text-rose-300",
  late: "bg-amber-500/20 border-amber-400/50 text-amber-300",
  leave: "bg-sky-500/20 border-sky-400/50 text-sky-300",
};

export function AttendanceMarkToggle({ value, onChange }: { value: AttendanceMark | undefined; onChange: (mark: AttendanceMark) => void }) {
  const marks: AttendanceMark[] = ["present", "absent", "late", "leave"];

  return (
    <div className="inline-flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
      {marks.map((mark) => {
        const isActive = value === mark;
        return (
          <button
            key={mark}
            type="button"
            onClick={() => onChange(mark)}
            title={ATTENDANCE_MARK_CONFIG[mark].label}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg border transition-all",
              isActive ? ACTIVE_STYLES[mark] : "border-transparent text-slate-600 hover:text-slate-400 hover:bg-white/[0.04]"
            )}
          >
            <Icon name={MARK_ICONS[mark]} size={14} />
          </button>
        );
      })}
    </div>
  );
}