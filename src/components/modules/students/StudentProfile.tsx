import type { Student } from "@/types";
import { getClassById, getSectionById, getParentByChildId } from "@/data";
import { formatDate, round1 } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Primitives";
import { ProgressRow } from "@/components/ui/Charts";

// =============================================================================
// STUDENT PROFILE
// Read-only detail view shown inside a Modal when a row's "view" action fires.
// =============================================================================

const STATUS_BADGE: Record<Student["status"], { variant: "success" | "warning" | "error" | "neutral" | "info"; label: string }> = {
  active: { variant: "success", label: "Active" },
  inactive: { variant: "neutral", label: "Inactive" },
  graduated: { variant: "info", label: "Graduated" },
  suspended: { variant: "error", label: "Suspended" },
  transferred: { variant: "warning", label: "Transferred" },
};

export function StudentProfile({ student }: { student: Student }) {
  const cls = getClassById(student.classId);
  const section = getSectionById(student.sectionId);
  const parent = getParentByChildId(student.id);
  const badge = STATUS_BADGE[student.status];
  const age = calculateAge(student.dob);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${student.avatarColor} flex items-center justify-center text-xl font-semibold text-white flex-shrink-0 shadow-lg`}>
          {student.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-white">
              {student.firstName} {student.lastName}
            </h3>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {student.studentCode} · {cls?.name} - {section?.name} · Roll #{student.rollNumber}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Attendance" value={`${round1(student.attendancePercentage)}%`} icon="checkSquare" />
        <MiniStat label="GPA" value={student.gpa.toFixed(1)} icon="award" />
        <MiniStat label="Age" value={`${age} yrs`} icon="calendar" />
      </div>

      {/* Attendance visual */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
        <ProgressRow label="Attendance this term" value={round1(student.attendancePercentage)} color="emerald" />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4">
        <DetailField icon="user" label="Gender" value={capitalize(student.gender)} />
        <DetailField icon="calendar" label="Date of Birth" value={formatDate(student.dob)} />
        <DetailField icon="phone" label="Phone" value={student.phone} />
        <DetailField icon="mail" label="Email" value={student.email} />
        <DetailField icon="mapPin" label="Address" value={`${student.address.line1}, ${student.address.city}`} />
        <DetailField icon="calendar" label="Admission Date" value={formatDate(student.admissionDate)} />
        {student.bloodGroup && <DetailField icon="activity" label="Blood Group" value={student.bloodGroup} />}
        <DetailField icon="calendar" label="Last Updated" value={formatDate(student.updatedAt)} />
      </div>

      {/* Guardian */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Guardian</p>
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center text-indigo-300 flex-shrink-0">
            <Icon name="userGroup" size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{student.guardianName}</p>
            <p className="text-xs text-slate-500">{student.guardianRelation}{parent ? ` · ${parent.email}` : ""}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: "checkSquare" | "award" | "calendar" }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 text-center">
      <Icon name={icon} size={16} className="text-indigo-300 mx-auto mb-1.5" />
      <p className="text-base font-semibold text-white">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function DetailField({ icon, label, value }: { icon: "user" | "calendar" | "phone" | "mail" | "mapPin" | "activity"; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon name={icon} size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-sm text-slate-200 truncate">{value}</p>
      </div>
    </div>
  );
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date("2026-07-19");
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}