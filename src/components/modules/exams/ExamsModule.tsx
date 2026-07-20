"use client";

import { useState } from "react";
import type { Exam } from "@/types";
import { getClassById, getSubjectById, getStudentById } from "@/data";
import { useExams } from "@/hooks/useExams";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/store/ToastContext";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { ExamForm } from "./Examform";
import { MarksEntryGrid } from "./MarkSentryGrid";
import type { ExamFormInput } from "@/hooks/useExams";

// =============================================================================
// EXAMS & RESULTS MODULE
// Staff: schedule exams, enter marks per subject, view class ranking table.
// Students/Parents: view their own result card for each completed exam.
// =============================================================================

const STATUS_BADGE: Record<Exam["status"], "info" | "warning" | "success"> = {
  scheduled: "info",
  ongoing: "warning",
  completed: "success",
};

const GRADE_BADGE: Record<string, "success" | "warning" | "error" | "info"> = {
  "A+": "success", A: "success", B: "info", C: "warning", D: "warning", F: "error",
};

type Tab = "marks" | "ranking";

export function ExamsModule() {
  const { session } = useAuth();
  const { exams, isSaving, createExam, deleteExam, updateExamStatus, enterMarks, getResultsForExam, getResultsForStudent, getRanking } = useExams();
  const toast = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("marks");

  if (!session) return null;
  const isStaff = session.user.role === "admin" || session.user.role === "principal" || session.user.role === "teacher";
  const studentId = session.user.linkedEntityId ?? session.user.id;

  async function handleCreate(input: ExamFormInput) {
    await createExam(input);
    setCreateOpen(false);
    toast.success("Exam scheduled", `${input.name} has been added to the calendar.`);
  }

  async function handleDelete(exam: Exam) {
    await deleteExam(exam.id);
    setDeleteTarget(null);
    if (selectedExam?.id === exam.id) setSelectedExam(null);
    toast.success("Exam removed", `${exam.name} has been deleted.`);
  }

  async function handleMarkComplete(exam: Exam) {
    await updateExamStatus(exam.id, "completed");
    toast.success("Exam marked complete", `${exam.name} results are now published.`);
  }

  // -------------------------------------------------------------------
  // Staff: exam detail (marks entry + ranking)
  // -------------------------------------------------------------------
  if (isStaff && selectedExam) {
    const cls = getClassById(selectedExam.classId);
    const results = getResultsForExam(selectedExam.id);
    const ranking = getRanking(selectedExam);
    const subjectId = activeSubjectId ?? selectedExam.subjectSchedule[0]?.subjectId ?? null;
    const currentSchedule = selectedExam.subjectSchedule.find((s) => s.subjectId === subjectId);

    return (
      <div className="space-y-5 animate-fade-in">
        <button onClick={() => setSelectedExam(null)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
          <Icon name="arrowLeft" size={13} />
          Back to exams
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">{selectedExam.name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {cls?.name} · {selectedExam.term} · {formatDate(selectedExam.startDate)} - {formatDate(selectedExam.endDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE[selectedExam.status]}>{capitalize(selectedExam.status)}</Badge>
            {selectedExam.status !== "completed" && (
              <Button size="sm" variant="secondary" icon="checkCircle" onClick={() => handleMarkComplete(selectedExam)}>
                Mark complete
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 w-fit">
          <TabButton active={tab === "marks"} onClick={() => setTab("marks")} label="Marks Entry" />
          <TabButton active={tab === "ranking"} onClick={() => setTab("ranking")} label="Ranking" />
        </div>

        {tab === "marks" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <Card className="lg:col-span-1 !p-2">
              <div className="space-y-1">
                {selectedExam.subjectSchedule.map((sched) => {
                  const subject = getSubjectById(sched.subjectId);
                  const active = subjectId === sched.subjectId;
                  return (
                    <button
                      key={sched.subjectId}
                      onClick={() => setActiveSubjectId(sched.subjectId)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        active ? "bg-indigo-500/15 text-indigo-200" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      }`}
                    >
                      <p className="font-medium">{subject?.name}</p>
                      <p className="text-[11px] text-slate-500">{formatDate(sched.date)}</p>
                    </button>
                  );
                })}
              </div>
            </Card>
            <div className="lg:col-span-3">
              {subjectId && currentSchedule && (
                <MarksEntryGrid
                  exam={selectedExam}
                  subjectId={subjectId}
                  maxMarks={currentSchedule.maxMarks}
                  existingResults={results}
                  submitting={isSaving}
                  onSave={async (marks) => {
                    for (const m of marks) {
                      await enterMarks(selectedExam.id, m.studentId, subjectId, m.marksObtained, currentSchedule.maxMarks);
                    }
                    toast.success("Marks saved", `${marks.length} scores recorded for ${getSubjectById(subjectId)?.name}.`);
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Percentage</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((entry) => {
                    const student = getStudentById(entry.studentId);
                    if (!student) return null;
                    const passed = entry.percentage >= 50;
                    return (
                      <tr key={entry.studentId} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <span className={entry.rank <= 3 ? "text-amber-400 font-semibold" : "text-slate-400"}>#{entry.rank}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${student.avatarColor} flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0`}>
                              {student.avatarInitials}
                            </div>
                            <span className="font-medium text-white">
                              {student.firstName} {student.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{entry.totalObtained}/{entry.totalMax}</td>
                        <td className="px-4 py-3 text-slate-300">{entry.percentage}%</td>
                        <td className="px-4 py-3">
                          <Badge variant={passed ? "success" : "error"}>{passed ? "Pass" : "Fail"}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {ranking.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center text-sm text-slate-500">
                        No marks entered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Student/Parent: result card view
  // -------------------------------------------------------------------
  if (!isStaff) {
    const student = getStudentById(studentId);
    const relevantExams = exams.filter((e) => e.classId === student?.classId);
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Exams & Results</h2>
          <p className="text-sm text-slate-400 mt-0.5">Your exam schedule and results</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {relevantExams.map((exam) => {
            const results = getResultsForStudent(exam.id, studentId);
            const totalObtained = results.reduce((sum, r) => sum + r.marksObtained, 0);
            const totalMax = results.reduce((sum, r) => sum + r.maxMarks, 0);
            const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
            return (
              <Card key={exam.id}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{exam.name}</p>
                    <p className="text-xs text-slate-500">
                      {exam.term} · {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                    </p>
                  </div>
                  <Badge variant={STATUS_BADGE[exam.status]}>{capitalize(exam.status)}</Badge>
                </div>
                {results.length > 0 ? (
                  <>
                    <div className="space-y-2 mb-3">
                      {results.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">{getSubjectById(r.subjectId)?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white">{r.marksObtained}/{r.maxMarks}</span>
                            <Badge variant={GRADE_BADGE[r.grade] ?? "neutral"}>{r.grade}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs text-slate-500">Overall</span>
                      <span className="text-sm font-semibold text-white">
                        {totalObtained}/{totalMax} ({pct}%)
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">Results not published yet.</p>
                )}
              </Card>
            );
          })}
          {relevantExams.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Icon name="award" size={28} className="text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No exams scheduled for your class yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Staff: exam list
  // -------------------------------------------------------------------
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Exams & Results</h2>
          <p className="text-sm text-slate-400 mt-0.5">{exams.length} exams scheduled across all classes</p>
        </div>
        <Button icon="plus" onClick={() => setCreateOpen(true)}>
          Schedule Exam
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((exam) => {
          const cls = getClassById(exam.classId);
          return (
            <Card key={exam.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center text-indigo-300">
                  <Icon name="award" size={18} />
                </div>
                <button onClick={() => setDeleteTarget(exam)} className="text-slate-500 hover:text-rose-400 transition-colors" aria-label="Delete exam">
                  <Icon name="trash" size={14} />
                </button>
              </div>
              <h3 className="text-base font-semibold text-white leading-snug">{exam.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {cls?.name} · {exam.term}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
              </p>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <Badge variant={STATUS_BADGE[exam.status]}>{capitalize(exam.status)}</Badge>
                <Button size="sm" variant="secondary" onClick={() => setSelectedExam(exam)}>
                  Manage
                </Button>
              </div>
            </Card>
          );
        })}
        {exams.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Icon name="award" size={28} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No exams scheduled yet.</p>
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Schedule Exam" description="Set up a new examination for a class." size="lg">
        <ExamForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} submitting={isSaving} />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete exam?"
        description={deleteTarget ? `This will permanently delete "${deleteTarget.name}" and all recorded results.` : ""}
        confirmLabel="Delete exam"
        loading={isSaving}
      />
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${active ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"}`}>
      {label}
    </button>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}