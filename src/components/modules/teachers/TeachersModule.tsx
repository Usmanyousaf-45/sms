"use client";

import { useState } from "react";
import type { Teacher } from "@/types";
import { SUBJECTS, getSubjectById } from "@/data";
import { useTeachers } from "@/hooks/UseTeachers";
import { useDataTable } from "@/hooks/useDataTable";
import { useToast } from "@/store/ToastContext";
import { formatCurrency, round1 } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { Select } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { TeacherForm } from "./TeacherForm";
import { TeacherProfile } from "./TeacherProfile";
import type { TeacherFormInput } from "@/hooks/UseTeachers";

// =============================================================================
// TEACHERS MODULE
// Same CRUD pattern as Students: search, filter (subject/status), sortable
// columns, pagination, add/edit modal, profile view, delete confirmation.
// =============================================================================

const STATUS_BADGE: Record<Teacher["status"], "success" | "warning" | "neutral"> = {
  active: "success",
  "on-leave": "warning",
  inactive: "neutral",
};

type ModalState =
  | { type: "add" }
  | { type: "edit"; teacher: Teacher }
  | { type: "view"; teacher: Teacher }
  | { type: "delete"; teacher: Teacher }
  | null;

export function TeachersModule() {
  const { teachers, isSaving, createTeacher, updateTeacher, deleteTeacher } = useTeachers();
  const toast = useToast();
  const [modal, setModal] = useState<ModalState>(null);

  const table = useDataTable<Teacher>({
    data: teachers,
    searchFields: ["firstName", "lastName", "teacherCode", "email"],
    initialSortField: "firstName",
    pageSize: 8,
  });

  async function handleCreate(input: TeacherFormInput) {
    await createTeacher(input);
    setModal(null);
    toast.success("Teacher added", `${input.firstName} ${input.lastName} has joined the faculty.`);
  }

  async function handleUpdate(id: string, input: TeacherFormInput) {
    await updateTeacher(id, input);
    setModal(null);
    toast.success("Changes saved", `${input.firstName} ${input.lastName}'s profile was updated.`);
  }

  async function handleDelete(teacher: Teacher) {
    await deleteTeacher(teacher.id);
    setModal(null);
    toast.success("Teacher removed", `${teacher.firstName} ${teacher.lastName} has been removed.`);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Teachers</h2>
          <p className="text-sm text-slate-400 mt-0.5">{teachers.length} faculty members across {SUBJECTS.length} subjects</p>
        </div>
        <Button icon="userPlus" onClick={() => setModal({ type: "add" })}>
          Add Teacher
        </Button>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={table.searchQuery}
              onChange={(e) => table.setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/[0.07] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 lg:flex gap-2">
            <Select
              value={table.filters.status ?? ""}
              onChange={(v) => table.setFilter("status", v)}
              placeholder="All statuses"
              options={[
                { value: "active", label: "Active" },
                { value: "on-leave", label: "On Leave" },
                { value: "inactive", label: "Inactive" },
              ]}
              className="lg:w-40"
            />
            <Select
              value={table.filters.employmentType ?? ""}
              onChange={(v) => table.setFilter("employmentType", v)}
              placeholder="All types"
              options={[
                { value: "full-time", label: "Full-time" },
                { value: "part-time", label: "Part-time" },
                { value: "contract", label: "Contract" },
              ]}
              className="lg:w-40"
            />
          </div>
          {(table.searchQuery || Object.values(table.filters).some(Boolean)) && (
            <Button variant="ghost" size="md" icon="x" onClick={table.clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <SortableHeader label="Teacher" field="firstName" table={table} />
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subjects</th>
                <SortableHeader label="Experience" field="experienceYears" table={table} />
                <SortableHeader label="Salary" field="salary" table={table} />
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.items.map((teacher) => {
                const subjectNames = teacher.subjectIds.map((id) => getSubjectById(id)?.name).filter(Boolean);
                return (
                  <tr key={teacher.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <button onClick={() => setModal({ type: "view", teacher })} className="flex items-center gap-3 text-left">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${teacher.avatarColor} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
                          {teacher.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
                            {teacher.firstName} {teacher.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{teacher.teacherCode}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {subjectNames.slice(0, 2).map((name) => (
                          <Badge key={name} variant="indigo">
                            {name}
                          </Badge>
                        ))}
                        {subjectNames.length > 2 && <Badge variant="neutral">+{subjectNames.length - 2}</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{teacher.experienceYears} yrs</td>
                    <td className="px-4 py-3 text-slate-300">{formatCurrency(teacher.salary)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[teacher.status]}>{formatStatus(teacher.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <RowAction icon="eye" label="View" onClick={() => setModal({ type: "view", teacher })} />
                        <RowAction icon="edit" label="Edit" onClick={() => setModal({ type: "edit", teacher })} />
                        <RowAction icon="trash" label="Delete" onClick={() => setModal({ type: "delete", teacher })} danger />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {table.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Icon name="briefcase" size={28} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No teachers match your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={table.page} totalPages={table.totalPages} total={table.total} pageSize={8} onPageChange={table.setPage} />
        </div>
      </Card>

      <Modal open={modal?.type === "add"} onClose={() => setModal(null)} title="Add Teacher" description="Add a new faculty member." size="lg">
        <TeacherForm onSubmit={handleCreate} onCancel={() => setModal(null)} submitting={isSaving} />
      </Modal>

      <Modal
        open={modal?.type === "edit"}
        onClose={() => setModal(null)}
        title="Edit Teacher"
        description={modal?.type === "edit" ? `Updating ${modal.teacher.firstName} ${modal.teacher.lastName}` : undefined}
        size="lg"
      >
        {modal?.type === "edit" && (
          <TeacherForm
            initialValue={modal.teacher}
            onSubmit={(input) => handleUpdate(modal.teacher.id, input)}
            onCancel={() => setModal(null)}
            submitting={isSaving}
          />
        )}
      </Modal>

      <Modal
        open={modal?.type === "view"}
        onClose={() => setModal(null)}
        title="Teacher Profile"
        size="lg"
        footer={
          modal?.type === "view" ? (
            <Button icon="edit" onClick={() => setModal({ type: "edit", teacher: modal.teacher })}>
              Edit Profile
            </Button>
          ) : undefined
        }
      >
        {modal?.type === "view" && <TeacherProfile teacher={modal.teacher} />}
      </Modal>

      <ConfirmDialog
        open={modal?.type === "delete"}
        onClose={() => setModal(null)}
        onConfirm={() => modal?.type === "delete" && handleDelete(modal.teacher)}
        title="Remove teacher?"
        description={
          modal?.type === "delete"
            ? `This will permanently remove ${modal.teacher.firstName} ${modal.teacher.lastName} from the system. This action cannot be undone.`
            : ""
        }
        confirmLabel="Remove teacher"
        loading={isSaving}
      />
    </div>
  );
}

function SortableHeader({
  label,
  field,
  table,
}: {
  label: string;
  field: keyof Teacher;
  table: ReturnType<typeof useDataTable<Teacher>>;
}) {
  const active = table.sortField === field;
  return (
    <th className="text-left px-4 py-3">
      <button
        onClick={() => table.toggleSort(field)}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
      >
        {label}
        <Icon
          name={active && table.sortDirection === "desc" ? "chevronDown" : "chevronUp"}
          size={12}
          className={active ? "text-indigo-400" : "text-slate-700"}
        />
      </button>
    </th>
  );
}

function RowAction({ icon, label, onClick, danger }: { icon: "eye" | "edit" | "trash"; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
        danger ? "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10" : "text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10"
      }`}
    >
      <Icon name={icon} size={14} />
    </button>
  );
}

function formatStatus(status: Teacher["status"]): string {
  if (status === "on-leave") return "On Leave";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
