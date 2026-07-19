import type { Parent } from "@/types";
import { getStudentById, getClassById, getSectionById } from "@/data";
import { formatDate, round1 } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Primitives";

// =============================================================================
// PARENT PROFILE
// Distinct from Student/Teacher profiles: the useful content here is each
// linked child's snapshot (class, attendance, GPA, status) rather than
// attributes of the parent record itself.
// =============================================================================

const STATUS_BADGE: Record<string, "success" | "neutral" | "info" | "error" | "warning"> = {
  active: "success",
  inactive: "neutral",
  graduated: "info",
  suspended: "error",
  transferred: "warning",
};

export function ParentProfile({ parent }: { parent: Parent }) {
  const children = parent.childStudentIds.map((id) => getStudentById(id)).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${parent.avatarColor} flex items-center justify-center text-xl font-semibold text-white flex-shrink-0 shadow-lg`}>
          {parent.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white">
            {parent.firstName} {parent.lastName}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {parent.occupation ?? "Guardian"} · {children.length} {children.length === 1 ? "child" : "children"} enrolled
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DetailField icon="phone" label="Phone" value={parent.phone} />
        <DetailField icon="mail" label="Email" value={parent.email} />
        <DetailField icon="mapPin" label="Address" value={`${parent.address.line1}, ${parent.address.city}`} />
        <DetailField icon="calendar" label="Registered Since" value={formatDate(parent.createdAt)} />
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Linked Children</p>
        <div className="space-y-2.5">
          {children.map((child) => {
            if (!child) return null;
            const cls = getClassById(child.classId);
            const section = getSectionById(child.sectionId);
            return (
              <div key={child.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${child.avatarColor} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
                  {child.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white truncate">
                      {child.firstName} {child.lastName}
                    </p>
                    <Badge variant={STATUS_BADGE[child.status] ?? "neutral"}>{capitalize(child.status)}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {cls?.name} · {section?.name} · Roll #{child.rollNumber}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div>
                    <p className="text-xs font-medium text-white">{round1(child.attendancePercentage)}%</p>
                    <p className="text-[10px] text-slate-500">Attendance</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{child.gpa.toFixed(1)}</p>
                    <p className="text-[10px] text-slate-500">GPA</p>
                  </div>
                </div>
              </div>
            );
          })}
          {children.length === 0 && <p className="text-xs text-slate-500">No children linked to this account.</p>}
        </div>
      </div>
    </div>
  );
}

function DetailField({ icon, label, value }: { icon: "phone" | "mail" | "mapPin" | "calendar"; label: string; value: string }) {
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