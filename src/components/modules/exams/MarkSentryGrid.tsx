"use client";

import { useState } from "react";
import type { Exam, ExamResult } from "@/types";
import { getStudentsByClass, getSubjectById } from "@/data";
import { gradeFromPercentage } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Primitives";

// =============================================================================
// MARKS ENTRY GRID
// One subject at a time (matching how teachers actually enter marks — a
// subject teacher grades their own subject's papers). Local edits buffer
// until "Save marks" is clicked, then flush through enterMarks per student.
// =============================================================================

const GRADE_BADGE: Record<string, "success" | "warning" | "error" | "info"> = {
  "A+": "success",
  A: "success",
  B: "info",
  C: "warning",
  D: "warning",
  F: "error",
};

interface MarksEntryGridProps {
  exam: Exam;
  subjectId: string;
  maxMarks: number;
  existingResults: ExamResult[];
  onSave: (marks: { studentId: string; marksObtained: number }[]) => Promise<void>;
  submitting: boolean;
}

export function MarksEntryGrid({ exam, subjectId, maxMarks, existingResults, onSave, submitting }: MarksEntryGridProps) {
  const students = getStudentsByClass(exam.classId);
  const subject = getSubjectById(subjectId);

  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    existingResults.forEach((r) => {
      if (r.subjectId === subjectId) initial[r.studentId] = String(r.marksObtained);
    });
    return initial;
  });

  function setMark(studentId: string, value: string) {
    setMarks((prev) => ({ ...prev, [studentId]: value }));
  }

  async function handleSave() {
    const entries = students
      .map((s) => ({ studentId: s.id, marksObtained: Number(marks[s.id]) }))
      .filter((e) => marks[e.studentId] !== undefined && marks[e.studentId] !== "" && !Number.isNaN(e.marksObtained));
    await onSave(entries);
  }

  const enteredCount = students.filter((s) => marks[s.id] !== undefined && marks[s.id] !== "").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{subject?.name}</p>
          <p className="text-xs text-slate-500">
            {enteredCount}/{students.length} marks entered · Max marks: {maxMarks}
          </p>
        </div>
        <Button size="sm" icon="check" onClick={handleSave} loading={submitting}>
          Save marks
        </Button>
      </div>

      <div className="rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="divide-y divide-white/[0.05] max-h-[440px] overflow-y-auto">
          {students.map((student) => {
            const value = marks[student.id] ?? "";
            const numValue = Number(value);
            const pct = value !== "" && !Number.isNaN(numValue) ? (numValue / maxMarks) * 100 : null;
            const grade = pct !== null ? gradeFromPercentage(pct) : null;
            return (
              <div key={student.id} className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.02]">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${student.avatarColor} flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0`}>
                  {student.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500">Roll #{student.rollNumber}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={maxMarks}
                  value={value}
                  onChange={(e) => setMark(student.id, e.target.value)}
                  placeholder="—"
                  className="w-20 bg-white/5 border border-white/10 focus:border-indigo-400/50 rounded-lg px-2.5 py-1.5 text-sm text-white text-center outline-none transition-all"
                />
                <div className="w-10 text-center flex-shrink-0">{grade && <Badge variant={GRADE_BADGE[grade] ?? "neutral"}>{grade}</Badge>}</div>
              </div>
            );
          })}
          {students.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Icon name="users" size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No students enrolled in this class.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}