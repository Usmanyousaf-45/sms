import type { Exam, ExamResult } from "@/types";
import { CLASSES, SUBJECTS, getStudentsByClass } from "./mockCore";
import { makeRng, pick, randomInt, isoDate, isoDateTime } from "./seedHelpers";
import { gradeFromPercentage, generateId } from "@/lib/utils";

// =============================================================================
// MOCK DATA — Exams & Results
// A "Mid-Term" and "Final Term" exam seeded per class, each scheduling 4-6
// subjects across consecutive days. Results are pre-generated for the
// Mid-Term (already completed) so the Results/Ranking views have real data;
// the Final Term is left "scheduled" so the module demonstrates that state too.
// =============================================================================

const rng = makeRng(606);

export const EXAMS: Exam[] = CLASSES.map((cls, i) => {
  const subjectIds = cls.subjectIds.slice(0, randomInt(rng, 4, 6));
  const midTermId = `exam_mid_${i + 1}`;
  const finalTermId = `exam_final_${i + 1}`;

  const midTerm: Exam = {
    id: midTermId,
    name: "Mid-Term Examination",
    classId: cls.id,
    term: "Term 1",
    startDate: isoDate(2026, 6, 1),
    endDate: isoDate(2026, 6, 10),
    status: "completed",
    subjectSchedule: subjectIds.map((subId, idx) => ({ subjectId: subId, date: isoDate(2026, 6, 1 + idx), maxMarks: 100 })),
    createdAt: isoDateTime(2026, 5, 1),
    updatedAt: isoDateTime(2026, 6, 10),
  };

  const finalTerm: Exam = {
    id: finalTermId,
    name: "Final Term Examination",
    classId: cls.id,
    term: "Term 2",
    startDate: isoDate(2026, 7, 27),
    endDate: isoDate(2026, 8, 5),
    status: "scheduled",
    subjectSchedule: subjectIds.map((subId, idx) => ({ subjectId: subId, date: isoDate(2026, 7, 27 + idx), maxMarks: 100 })),
    createdAt: isoDateTime(2026, 7, 1),
    updatedAt: isoDateTime(2026, 7, 1),
  };

  return [midTerm, finalTerm];
}).flat();

/** Pre-generated results for every completed exam (Mid-Term), so Results/Ranking have real data. */
export const EXAM_RESULTS: ExamResult[] = EXAMS.filter((e) => e.status === "completed").flatMap((exam) => {
  const students = getStudentsByClass(exam.classId);
  return students.flatMap((student) =>
    exam.subjectSchedule.map((sched) => {
      const marksObtained = randomInt(rng, Math.round(sched.maxMarks * 0.35), sched.maxMarks);
      return {
        id: generateId("result"),
        examId: exam.id,
        studentId: student.id,
        subjectId: sched.subjectId,
        marksObtained,
        maxMarks: sched.maxMarks,
        grade: gradeFromPercentage((marksObtained / sched.maxMarks) * 100),
      };
    })
  );
});

export function getExamById(id: string): Exam | undefined {
  return EXAMS.find((e) => e.id === id);
}

void pick; // reserved for future template expansion
void SUBJECTS;