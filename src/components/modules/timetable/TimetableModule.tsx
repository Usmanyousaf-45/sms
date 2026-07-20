"use client";

import { useEffect, useState } from "react";
import type { Weekday } from "@/types";
import { CLASSES, ALL_SECTIONS, getSubjectById, getTeacherById } from "@/data";
import { useTimetable, WEEKDAYS, PERIODS } from "@/hooks/useTimetable";
import { useToast } from "@/store/ToastContext";
import { formatTime } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Primitives";
import { Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SlotForm } from "./SlotForm";
import type { SlotFormInput } from "@/hooks/useTimetable";

// =============================================================================
// TIMETABLE MODULE
// A weekly grid (days x periods) for the selected section. Every cell is
// clickable to assign/edit/clear a subject+teacher+room. Grids seed a
// plausible default schedule on first view of a section so it never looks
// empty, but every cell remains fully editable afterward.
// =============================================================================

const SUBJECT_COLOR_HEX: Record<string, string> = {
  sky: "#0ea5e9", violet: "#8b5cf6", amber: "#f59e0b", emerald: "#10b981",
  rose: "#f43f5e", cyan: "#06b6d4", orange: "#f97316", lime: "#84cc16",
  fuchsia: "#d946ef", teal: "#14b8a6", red: "#ef4444", pink: "#ec4899",
};

export function TimetableModule() {
  const { getSlot, getSectionGrid, ensureSeeded, hasTeacherConflict, upsertSlot, clearSlot, isSaving } = useTimetable();
  const toast = useToast();

  const [classId, setClassId] = useState(CLASSES[0]?.id ?? "");
  const [sectionId, setSectionId] = useState(ALL_SECTIONS.find((s) => s.classId === CLASSES[0]?.id)?.id ?? "");
  const [activeCell, setActiveCell] = useState<{ day: Weekday; period: number } | null>(null);

  const availableSections = ALL_SECTIONS.filter((s) => s.classId === classId);
  const currentClass = CLASSES.find((c) => c.id === classId);

  useEffect(() => {
    if (sectionId && currentClass) {
      const teacherIds = availableSections.find((s) => s.id === sectionId)?.classTeacherId;
      ensureSeeded(sectionId, currentClass.subjectIds, teacherIds ? [teacherIds] : currentClass.subjectIds.map((_, i) => `tch_${(i % 24) + 1}`));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const grid = getSectionGrid(sectionId);
  const scheduledCount = grid.length;
  const totalSlots = PERIODS.length * 6;

  async function handleSaveSlot(input: SlotFormInput) {
    if (!activeCell) return;
    await upsertSlot(sectionId, activeCell.day, activeCell.period, input);
    setActiveCell(null);
    toast.success("Timetable updated", `${activeCell.day}, Period ${activeCell.period} was saved.`);
  }

  async function handleClearSlot() {
    if (!activeCell) return;
    await clearSlot(sectionId, activeCell.day, activeCell.period);
    setActiveCell(null);
    toast.success("Slot cleared", `${activeCell.day}, Period ${activeCell.period} is now empty.`);
  }

  const editingSlot = activeCell ? getSlot(sectionId, activeCell.day, activeCell.period) : undefined;
  const activePeriodDef = activeCell ? PERIODS.find((p) => p.period === activeCell.period) : undefined;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Timetable</h2>
          <p className="text-sm text-slate-400 mt-0.5">Click any cell to assign or edit a class period</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-slate-500 hidden sm:inline">
            {scheduledCount}/{totalSlots} periods scheduled
          </span>
          <Select
            value={classId}
            onChange={(v) => {
              setClassId(v);
              const firstSection = ALL_SECTIONS.find((s) => s.classId === v);
              setSectionId(firstSection?.id ?? "");
            }}
            options={CLASSES.map((c) => ({ value: c.id, label: c.name }))}
            className="w-40"
          />
          <Select value={sectionId} onChange={setSectionId} options={availableSections.map((s) => ({ value: s.id, label: `Section ${s.name}` }))} className="w-36" />
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-r border-white/[0.06] w-24 sticky left-0 bg-slate-950/80 backdrop-blur-sm">
                  Period
                </th>
                {WEEKDAYS.slice(0, 6).map((day) => (
                  <th key={day} className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p.period}>
                  <td className="px-3 py-2 border-r border-b border-white/[0.05] sticky left-0 bg-slate-950/80 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-white">P{p.period}</p>
                    <p className="text-[10px] text-slate-500">{formatTime(p.startTime)}</p>
                  </td>
                  {WEEKDAYS.slice(0, 6).map((day) => {
                    const slot = getSlot(sectionId, day, p.period);
                    const subject = slot ? getSubjectById(slot.subjectId) : undefined;
                    const teacher = slot ? getTeacherById(slot.teacherId) : undefined;
                    const colorHex = subject ? SUBJECT_COLOR_HEX[subject.color] ?? "#6366f1" : undefined;
                    return (
                      <td key={day} className="border-b border-white/[0.05] p-1.5 align-top">
                        <button
                          onClick={() => setActiveCell({ day, period: p.period })}
                          className="w-full h-full min-h-[68px] rounded-lg p-2.5 text-left transition-all hover:ring-1 hover:ring-white/20"
                          style={{
                            backgroundColor: slot ? `${colorHex}18` : "rgba(255,255,255,0.02)",
                            border: slot ? `1px solid ${colorHex}40` : "1px dashed rgba(255,255,255,0.08)",
                          }}
                        >
                          {slot ? (
                            <>
                              <p className="text-xs font-medium truncate" style={{ color: colorHex }}>
                                {subject?.name ?? "Unknown"}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unassigned"}
                              </p>
                              <p className="text-[10px] text-slate-600 mt-0.5">{slot.room}</p>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-600 flex items-center gap-1">
                              <Icon name="plus" size={11} />
                              Add
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={activeCell !== null}
        onClose={() => setActiveCell(null)}
        title={editingSlot ? "Edit Period" : "Assign Period"}
        size="md"
      >
        {activeCell && activePeriodDef && (
          <SlotForm
            day={activeCell.day}
            period={activeCell.period}
            startTime={activePeriodDef.startTime}
            endTime={activePeriodDef.endTime}
            initialValue={editingSlot}
            onSubmit={handleSaveSlot}
            onClear={editingSlot ? handleClearSlot : undefined}
            onCancel={() => setActiveCell(null)}
            submitting={isSaving}
            checkConflict={(teacherId) => hasTeacherConflict(teacherId, activeCell.day, activeCell.period, editingSlot?.id)}
          />
        )}
      </Modal>
    </div>
  );
}