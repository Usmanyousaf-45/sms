import type { Teacher } from "@/types";
import { getSubjectById, getSectionById } from "@/data";
import { formatDate, formatCurrency, round1 } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Primitives";
import { ProgressRow } from "@/components/ui/Charts";

// =============================================================================
// TEACHER PROFILE
// =============================================================================

const STATUS_BADGE: Record<Teacher["status"], { variant: "success" | "warning" | "neutral"; label: string }> = {
  active: { variant: "success", label: "Active" },
  "on-leave": { variant: "warning", label: "On Leave" },
  inactive: { variant: "neutral", label: "Inactive" },
};

export function TeacherProfile({ teacher }: { teacher: Teacher }) {
  const badge = STATUS_BADGE[teacher.status];
  const subjects = teacher.subjectIds.map((id) => getSubjectById(id)).filter(Boolean);
  const classes = teacher.assignedClassIds.map((id) => getSectionById(id)).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${teacher.avatarColor} flex items-center justify-center text-xl font-semibold text-white flex-shrink-0 shadow-lg`}>
          {teacher.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-white">
              {teacher.firstName} {teacher.lastName}
            </h3>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {teacher.teacherCode} · {teacher.qualification} · {teacher.experienceYears} yrs experience
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Attendance" value={`${round1(teacher.attendancePercentage)}%`} icon="checkSquare" />
        <MiniStat label="Rating" value={teacher.performanceRating.toFixed(1)} icon="star" />
        <MiniStat label="Classes" value={String(classes.length)} icon="layers" />
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
        <ProgressRow label="Performance rating" value={Math.round((teacher.performanceRating / 5) * 100)} color="amber" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DetailField icon="user" label="Gender" value={capitalize(teacher.gender)} />
        <DetailField icon="briefcase" label="Employment Type" value={capitalize(teacher.employmentType.replace("-", " "))} />
        <DetailField icon="phone" label="Phone" value={teacher.phone} />
        <DetailField icon="mail" label="Email" value={teacher.email} />
        <DetailField icon="mapPin" label="Address" value={`${teacher.address.line1}, ${teacher.address.city}`} />
        <DetailField icon="calendar" label="Join Date" value={formatDate(teacher.joinDate)} />
        <DetailField icon="dollarSign" label="Monthly Salary" value={formatCurrency(teacher.salary)} />
        <DetailField icon="calendar" label="Last Updated" value={formatDate(teacher.updatedAt)} />
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Subjects Taught</p>
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => (
            <Badge key={s!.id} variant="indigo">
              {s!.name}
            </Badge>
          ))}
          {subjects.length === 0 && <p className="text-xs text-slate-500">No subjects assigned.</p>}
        </div>
      </div>

      {classes.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Assigned Classes</p>
          <div className="flex flex-wrap gap-1.5">
            {classes.map((c) => (
              <Badge key={c!.id} variant="neutral">
                Section {c!.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: "checkSquare" | "star" | "layers" }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 text-center">
      <Icon name={icon} size={16} className="text-indigo-300 mx-auto mb-1.5" />
      <p className="text-base font-semibold text-white">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function DetailField({ icon, label, value }: { icon: "user" | "briefcase" | "phone" | "mail" | "mapPin" | "calendar" | "dollarSign"; label: string; value: string }) {
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
