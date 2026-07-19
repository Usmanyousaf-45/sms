"use client";

import { useState } from "react";
import type { Student } from "@/types";
import { CLASSES } from "@/data";
import { useStudents } from "@/hooks/useStudents";
import { useDataTable } from "@/hooks/useDataTable";
import { useToast } from "@/store/ToastContext";
import { getClassById, getSectionById } from "@/data";
import { round1 } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { Select } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { StudentForm } from "./StudentForm";
import { StudentProfile } from "./StudentProfile";
import type { StudentFormInput } from "@/hooks/useStudents";

// =============================================================================
// STUDENTS MODULE
// Full CRUD: search, filter by class/section/status, sortable columns,
// pagination, add/edit modal, profile view, delete confirmation.
// =============================================================================

const STATUS_BADGE: Record<Student["status"], "success" | "neutral" | "info" | "error" | "warning"> = {
  active: "success",
  inactive: "neutral",
  graduated: "info",
  suspended: "error",
  transferred: "warning",
};

type ModalState = { type: "add" } | { type: "edit"; student: Student } | { type: "view"; student: Student } | { type: "delete"; student: Student } | null;

export function StudentsModule() {
  const { students, isSaving, createStudent, updateStudent, deleteStudent } = useStudents();
  const toast = useToast();
  const [modal, setModal] = useState<ModalState>(null);

  const table = useDataTable<Student>({
    data: students,
    searchFields: ["firstName", "lastName", "studentCode", "email", "rollNumber"],
    initialSortField: "firstName",
    pageSize: 8,
  });

  async function handleCreate(input: StudentFormInput) {
    await createStudent(input);
    setModal(null);
    toast.success("Student added", `${input.firstName} ${input.lastName} has been enrolled.`);
  }

  async function handleUpdate(id: string, input: StudentFormInput) {
    await updateStudent(id, input);
    setModal(null);
    toast.success("Changes saved", `${input.firstName} ${input.lastName}'s profile was updated.`);
  }

  async function handleDelete(student: Student) {
    await deleteStudent(student.id);
    setModal(null);
    toast.success("Student removed", `${student.firstName} ${student.lastName} has been removed.`);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Students</h2>
          <p className="text-sm text-slate-400 mt-0.5">{students.length} students enrolled across {CLASSES.length} classes</p>
        </div>
        <Button icon="userPlus" onClick={() => setModal({ type: "add" })}>
          Add Student
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="!p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID, roll number, or email..."
              value={table.searchQuery}
              onChange={(e) => table.setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/[0.07] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 lg:flex gap-2">
            <Select
              value={table.filters.classId ?? ""}
              onChange={(v) => table.setFilter("classId", v)}
              placeholder="All classes"
              options={CLASSES.map((c) => ({ value: c.id, label: c.name }))}
              className="lg:w-40"
            />
            <Select
              value={table.filters.status ?? ""}
              onChange={(v) => table.setFilter("status", v)}
              placeholder="All statuses"
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "graduated", label: "Graduated" },
                { value: "suspended", label: "Suspended" },
                { value: "transferred", label: "Transferred" },
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

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <SortableHeader label="Student" field="firstName" table={table} />
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class / Section</th>
                <SortableHeader label="Attendance" field="attendancePercentage" table={table} />
                <SortableHeader label="GPA" field="gpa" table={table} />
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.items.map((student) => {
                const cls = getClassById(student.classId);
                const section = getSectionById(student.sectionId);
                return (
                  <tr key={student.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModal({ type: "view", student })}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${student.avatarColor} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
                          {student.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{student.studentCode}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {cls?.name} · {section?.name}
                      <p className="text-xs text-slate-500">Roll #{student.rollNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{round1(student.attendancePercentage)}%</td>
                    <td className="px-4 py-3 text-slate-300">{student.gpa.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[student.status]}>{capitalize(student.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <RowAction icon="eye" label="View" onClick={() => setModal({ type: "view", student })} />
                        <RowAction icon="edit" label="Edit" onClick={() => setModal({ type: "edit", student })} />
                        <RowAction icon="trash" label="Delete" onClick={() => setModal({ type: "delete", student })} danger />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {table.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Icon name="users" size={28} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No students match your search or filters.</p>
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

      {/* Add modal */}
      <Modal open={modal?.type === "add"} onClose={() => setModal(null)} title="Add Student" description="Enroll a new student into the school." size="lg">
        <StudentForm onSubmit={handleCreate} onCancel={() => setModal(null)} submitting={isSaving} />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={modal?.type === "edit"}
        onClose={() => setModal(null)}
        title="Edit Student"
        description={modal?.type === "edit" ? `Updating ${modal.student.firstName} ${modal.student.lastName}` : undefined}
        size="lg"
      >
        {modal?.type === "edit" && (
          <StudentForm
            initialValue={modal.student}
            onSubmit={(input) => handleUpdate(modal.student.id, input)}
            onCancel={() => setModal(null)}
            submitting={isSaving}
          />
        )}
      </Modal>

      {/* Profile view modal */}
      <Modal
        open={modal?.type === "view"}
        onClose={() => setModal(null)}
        title="Student Profile"
        size="lg"
        footer={
          modal?.type === "view" ? (
            <Button icon="edit" onClick={() => setModal({ type: "edit", student: modal.student })}>
              Edit Profile
            </Button>
          ) : undefined
        }
      >
        {modal?.type === "view" && <StudentProfile student={modal.student} />}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={modal?.type === "delete"}
        onClose={() => setModal(null)}
        onConfirm={() => modal?.type === "delete" && handleDelete(modal.student)}
        title="Remove student?"
        description={
          modal?.type === "delete"
            ? `This will permanently remove ${modal.student.firstName} ${modal.student.lastName} from the system. This action cannot be undone.`
            : ""
        }
        confirmLabel="Remove student"
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
  field: keyof Student;
  table: ReturnType<typeof useDataTable<Student>>;
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}