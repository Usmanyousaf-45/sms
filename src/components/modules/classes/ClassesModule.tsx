"use client";

import { useState, useMemo } from "react";
import type { SchoolClass, ClassSection } from "@/types";
import { SUBJECTS, getSubjectById, getTeacherById } from "@/data";
import { useClasses, liveStudentCountForSection } from "@/hooks/useClasses";
import { useToast } from "@/store/ToastContext";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { ProgressRow } from "@/components/ui/Charts";
import { ClassForm } from "./ClassForm";
import { SectionForm } from "./SectionForm";
import type { ClassFormInput, SectionFormInput } from "@/hooks/UseClasses";

// =============================================================================
// CLASSES & SECTIONS MODULE
// Master/detail layout (not a flat table like Students/Teachers/Parents)
// because Classes contain nested Sections. Grid of class cards -> click into
// a class -> section CRUD happens inline in the detail view. Deliberately
// avoids modal-inside-modal by keeping the detail view as page state, not a
// dialog, with section add/edit as single-level modals.
// =============================================================================

type ClassModalState = { type: "add" } | { type: "edit"; cls: SchoolClass } | { type: "delete"; cls: SchoolClass } | null;
type SectionModalState = { type: "add" } | { type: "edit"; section: ClassSection } | { type: "delete"; section: ClassSection } | null;

export function ClassesModule() {
  const { classes, isSaving, createClass, updateClass, deleteClass, addSection, updateSection, deleteSection } = useClasses();
  const toast = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classModal, setClassModal] = useState<ClassModalState>(null);
  const [sectionModal, setSectionModal] = useState<SectionModalState>(null);

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

  async function handleCreateClass(input: ClassFormInput) {
    await createClass(input);
    setClassModal(null);
    toast.success("Class created", `${input.name} has been added.`);
  }

  async function handleUpdateClass(id: string, input: ClassFormInput) {
    await updateClass(id, input);
    setClassModal(null);
    toast.success("Class updated", `${input.name} was saved.`);
  }

  async function handleDeleteClass(cls: SchoolClass) {
    await deleteClass(cls.id);
    setClassModal(null);
    if (selectedClassId === cls.id) setSelectedClassId(null);
    toast.success("Class removed", `${cls.name} has been deleted.`);
  }

  async function handleAddSection(input: SectionFormInput) {
    if (!selectedClass) return;
    await addSection(selectedClass.id, input);
    setSectionModal(null);
    toast.success("Section added", `Section ${input.name} created in ${selectedClass.name}.`);
  }

  async function handleUpdateSection(sectionId: string, input: SectionFormInput) {
    if (!selectedClass) return;
    await updateSection(selectedClass.id, sectionId, input);
    setSectionModal(null);
    toast.success("Section updated", `Section ${input.name} was saved.`);
  }

  async function handleDeleteSection(section: ClassSection) {
    if (!selectedClass) return;
    await deleteSection(selectedClass.id, section.id);
    setSectionModal(null);
    toast.success("Section removed", `Section ${section.name} has been deleted.`);
  }

  if (selectedClass) {
    return (
      <ClassDetail
        cls={selectedClass}
        isSaving={isSaving}
        onBack={() => setSelectedClassId(null)}
        onEditClass={() => setClassModal({ type: "edit", cls: selectedClass })}
        onDeleteClass={() => setClassModal({ type: "delete", cls: selectedClass })}
        sectionModal={sectionModal}
        setSectionModal={setSectionModal}
        onAddSection={handleAddSection}
        onUpdateSection={handleUpdateSection}
        onDeleteSection={handleDeleteSection}
        classModal={classModal}
        setClassModal={setClassModal}
        onUpdateClass={handleUpdateClass}
        onDeleteClassConfirm={handleDeleteClass}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Classes & Sections</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {classes.length} classes · {classes.reduce((sum, c) => sum + c.sections.length, 0)} sections total
          </p>
        </div>
        <Button icon="plus" onClick={() => setClassModal({ type: "add" })}>
          Add Class
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <ClassCard key={cls.id} cls={cls} onClick={() => setSelectedClassId(cls.id)} />
        ))}
        {classes.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Icon name="layers" size={28} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No classes yet. Create your first one.</p>
          </div>
        )}
      </div>

      <Modal open={classModal?.type === "add"} onClose={() => setClassModal(null)} title="Add Class" description="Create a new grade/class level." size="md">
        <ClassForm onSubmit={handleCreateClass} onCancel={() => setClassModal(null)} submitting={isSaving} />
      </Modal>

      <Modal
        open={classModal?.type === "edit"}
        onClose={() => setClassModal(null)}
        title="Edit Class"
        description={classModal?.type === "edit" ? `Updating ${classModal.cls.name}` : undefined}
        size="md"
      >
        {classModal?.type === "edit" && (
          <ClassForm
            initialValue={classModal.cls}
            onSubmit={(input) => handleUpdateClass(classModal.cls.id, input)}
            onCancel={() => setClassModal(null)}
            submitting={isSaving}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={classModal?.type === "delete"}
        onClose={() => setClassModal(null)}
        onConfirm={() => classModal?.type === "delete" && handleDeleteClass(classModal.cls)}
        title="Delete class?"
        description={
          classModal?.type === "delete"
            ? `This will permanently delete ${classModal.cls.name} and all ${classModal.cls.sections.length} of its sections. Students already enrolled will keep their records but lose their class reference. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete class"
        loading={isSaving}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Class Card (grid view)
// -----------------------------------------------------------------------------

function ClassCard({ cls, onClick }: { cls: SchoolClass; onClick: () => void }) {
  const totalStudents = useMemo(() => cls.sections.reduce((sum, s) => sum + liveStudentCountForSection(s.id), 0), [cls.sections]);
  const totalCapacity = cls.sections.reduce((sum, s) => sum + s.capacity, 0);
  const utilization = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:bg-white/[0.05] hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center text-indigo-300">
          <Icon name="layers" size={18} />
        </div>
        <Icon name="arrowUpRight" size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
      <h3 className="text-base font-semibold text-white">{cls.name}</h3>
      <p className="text-xs text-slate-500 mt-0.5">
        {cls.sections.length} {cls.sections.length === 1 ? "section" : "sections"} · {cls.subjectIds.length} subjects
      </p>
      <div className="mt-4">
        <ProgressRow label="Enrollment" value={utilization} color="indigo" />
        <p className="text-[11px] text-slate-500 mt-1.5">{totalStudents} / {totalCapacity} students</p>
      </div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Class Detail (drill-down view with sections table)
// -----------------------------------------------------------------------------

interface ClassDetailProps {
  cls: SchoolClass;
  isSaving: boolean;
  onBack: () => void;
  onEditClass: () => void;
  onDeleteClass: () => void;
  sectionModal: SectionModalState;
  setSectionModal: (m: SectionModalState) => void;
  onAddSection: (input: SectionFormInput) => Promise<void>;
  onUpdateSection: (sectionId: string, input: SectionFormInput) => Promise<void>;
  onDeleteSection: (section: ClassSection) => Promise<void>;
  classModal: ClassModalState;
  setClassModal: (m: ClassModalState) => void;
  onUpdateClass: (id: string, input: ClassFormInput) => Promise<void>;
  onDeleteClassConfirm: (cls: SchoolClass) => Promise<void>;
}

function ClassDetail({
  cls,
  isSaving,
  onBack,
  onEditClass,
  onDeleteClass,
  sectionModal,
  setSectionModal,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  classModal,
  setClassModal,
  onUpdateClass,
  onDeleteClassConfirm,
}: ClassDetailProps) {
  const subjects = cls.subjectIds.map((id) => getSubjectById(id)).filter(Boolean);

  return (
    <div className="space-y-5 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
        <Icon name="arrowLeft" size={13} />
        Back to all classes
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">{cls.name}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Grade level {cls.gradeLevel} · {cls.sections.length} sections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon="edit" onClick={onEditClass}>
            Edit Class
          </Button>
          <Button variant="danger" icon="trash" onClick={onDeleteClass}>
            Delete
          </Button>
        </div>
      </div>

      <Card title="Subjects">
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => (
            <Badge key={s!.id} variant="indigo">
              {s!.name}
            </Badge>
          ))}
          {subjects.length === 0 && <p className="text-xs text-slate-500">No subjects assigned.</p>}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Sections</h3>
        <Button size="sm" icon="plus" onClick={() => setSectionModal({ type: "add" })}>
          Add Section
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Section</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Teacher</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Room</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrollment</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cls.sections.map((section) => {
                const teacher = section.classTeacherId ? getTeacherById(section.classTeacherId) : undefined;
                const count = liveStudentCountForSection(section.id);
                const pct = section.capacity > 0 ? Math.round((count / section.capacity) * 100) : 0;
                return (
                  <tr key={section.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">Section {section.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {teacher ? `${teacher.firstName} ${teacher.lastName}` : <span className="text-slate-600">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{section.roomNumber || "—"}</td>
                    <td className="px-4 py-3 w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? "bg-rose-500" : "bg-indigo-500"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">{count}/{section.capacity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <RowAction icon="edit" label="Edit" onClick={() => setSectionModal({ type: "edit", section })} />
                        <RowAction icon="trash" label="Delete" onClick={() => setSectionModal({ type: "delete", section })} danger />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {cls.sections.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm text-slate-500">No sections yet. Add one to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section modals */}
      <Modal open={sectionModal?.type === "add"} onClose={() => setSectionModal(null)} title="Add Section" description={`New section in ${cls.name}`} size="md">
        <SectionForm onSubmit={onAddSection} onCancel={() => setSectionModal(null)} submitting={isSaving} />
      </Modal>

      <Modal
        open={sectionModal?.type === "edit"}
        onClose={() => setSectionModal(null)}
        title="Edit Section"
        description={sectionModal?.type === "edit" ? `Section ${sectionModal.section.name}` : undefined}
        size="md"
      >
        {sectionModal?.type === "edit" && (
          <SectionForm
            initialValue={sectionModal.section}
            onSubmit={(input) => onUpdateSection(sectionModal.section.id, input)}
            onCancel={() => setSectionModal(null)}
            submitting={isSaving}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={sectionModal?.type === "delete"}
        onClose={() => setSectionModal(null)}
        onConfirm={() => sectionModal?.type === "delete" && onDeleteSection(sectionModal.section)}
        title="Delete section?"
        description={
          sectionModal?.type === "delete"
            ? `This will permanently delete Section ${sectionModal.section.name}. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete section"
        loading={isSaving}
      />

      {/* Class-level modals (edit/delete), rendered here too since Detail is where they're triggered from */}
      <Modal open={classModal?.type === "edit"} onClose={() => setClassModal(null)} title="Edit Class" size="md">
        {classModal?.type === "edit" && (
          <ClassForm
            initialValue={classModal.cls}
            onSubmit={(input) => onUpdateClass(classModal.cls.id, input)}
            onCancel={() => setClassModal(null)}
            submitting={isSaving}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={classModal?.type === "delete"}
        onClose={() => setClassModal(null)}
        onConfirm={() => classModal?.type === "delete" && onDeleteClassConfirm(classModal.cls)}
        title="Delete class?"
        description={
          classModal?.type === "delete"
            ? `This will permanently delete ${classModal.cls.name} and all ${classModal.cls.sections.length} of its sections. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete class"
        loading={isSaving}
      />
    </div>
  );
}

function RowAction({ icon, label, onClick, danger }: { icon: "edit" | "trash"; label: string; onClick: () => void; danger?: boolean }) {
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