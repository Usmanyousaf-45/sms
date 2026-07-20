"use client";

import { useState } from "react";
import type { Assignment, AssignmentSubmission } from "@/types";
import { getCourseById, getStudentById } from "@/data";
import { useAssignments } from "@/hooks/useAssignments";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/store/ToastContext";
import { formatDate, cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { AssignmentForm } from "./AssignmentForm";
import type { AssignmentFormInput } from "@/hooks/useAssignments";

// =============================================================================
// ASSIGNMENTS MODULE
// Staff (admin/principal/teacher) see the full list with submission stats and
// can create assignments + grade individual submissions. Students see only
// their own submission status per assignment, with a one-click Submit action.
// =============================================================================

const STATUS_BADGE: Record<AssignmentSubmission["status"], "neutral" | "info" | "success" | "error"> = {
  pending: "neutral",
  submitted: "info",
  graded: "success",
  late: "error",
};

export function AssignmentsModule() {
  const { session } = useAuth();
  const { assignments, isSaving, createAssignment, deleteAssignment, submitAssignment, gradeSubmission } = useAssignments();
  const toast = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);

  if (!session) return null;
  const isStaff = session.user.role === "admin" || session.user.role === "principal" || session.user.role === "teacher";
  const studentId = session.user.linkedEntityId ?? session.user.id;

  async function handleCreate(input: AssignmentFormInput) {
    await createAssignment(input);
    setCreateOpen(false);
    toast.success("Assignment created", `${input.title} has been published.`);
  }

  async function handleDelete(assignment: Assignment) {
    await deleteAssignment(assignment.id);
    setDeleteTarget(null);
    if (selectedAssignment?.id === assignment.id) setSelectedAssignment(null);
    toast.success("Assignment removed", `${assignment.title} has been deleted.`);
  }

  async function handleStudentSubmit(assignment: Assignment) {
    await submitAssignment(assignment.id, studentId);
    toast.success("Assignment submitted", `Your work for "${assignment.title}" has been submitted.`);
  }

  async function handleGrade(score: number, comments: string) {
    if (!selectedAssignment || !gradingSubmission) return;
    await gradeSubmission(selectedAssignment.id, gradingSubmission.id, score, comments);
    setGradingSubmission(null);
    toast.success("Submission graded", "The score and feedback have been saved.");
  }

  // -------------------------------------------------------------------
  // Staff: submission detail view for one assignment
  // -------------------------------------------------------------------
  if (isStaff && selectedAssignment) {
    const course = getCourseById(selectedAssignment.courseId);
    return (
      <div className="space-y-5 animate-fade-in">
        <button onClick={() => setSelectedAssignment(null)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
          <Icon name="arrowLeft" size={13} />
          Back to assignments
        </button>

        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">{selectedAssignment.title}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {course?.title} · Due {formatDate(selectedAssignment.dueDate)} · Max score {selectedAssignment.maxScore}
          </p>
        </div>

        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedAssignment.submissions.map((submission) => {
                  const student = getStudentById(submission.studentId);
                  if (!student) return null;
                  return (
                    <tr key={submission.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
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
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[submission.status]}>{capitalize(submission.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {submission.score !== undefined ? `${submission.score}/${selectedAssignment.maxScore}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setGradingSubmission(submission)}
                          disabled={submission.status === "pending"}
                        >
                          {submission.status === "graded" ? "Update grade" : "Grade"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <GradeModal
          submission={gradingSubmission}
          maxScore={selectedAssignment.maxScore}
          onClose={() => setGradingSubmission(null)}
          onSave={handleGrade}
          submitting={isSaving}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------
  // List view (both staff and students)
  // -------------------------------------------------------------------
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Assignments</h2>
          <p className="text-sm text-slate-400 mt-0.5">{assignments.length} assignments {isStaff ? "published" : "assigned to you"}</p>
        </div>
        {isStaff && (
          <Button icon="plus" onClick={() => setCreateOpen(true)}>
            Create Assignment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((assignment) => {
          const course = getCourseById(assignment.courseId);
          const mySubmission = assignment.submissions.find((s) => s.studentId === studentId);
          const submittedCount = assignment.submissions.filter((s) => s.status !== "pending").length;
          const gradedCount = assignment.submissions.filter((s) => s.status === "graded").length;
          const isOverdue = new Date(assignment.dueDate) < new Date("2026-07-19");

          return (
            <Card key={assignment.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center text-indigo-300">
                  <Icon name="clipboard" size={18} />
                </div>
                {isStaff ? (
                  <button
                    onClick={() => setDeleteTarget(assignment)}
                    className="text-slate-500 hover:text-rose-400 transition-colors"
                    aria-label="Delete assignment"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                ) : (
                  mySubmission && <Badge variant={STATUS_BADGE[mySubmission.status]}>{capitalize(mySubmission.status)}</Badge>
                )}
              </div>
              <h3 className="text-base font-semibold text-white leading-snug">{assignment.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{course?.title}</p>
              <p className={cn("text-xs mt-2 flex items-center gap-1", isOverdue ? "text-rose-400" : "text-slate-500")}>
                <Icon name="calendar" size={12} />
                Due {formatDate(assignment.dueDate)}
              </p>

              <div className="mt-auto pt-4">
                {isStaff ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>{submittedCount}/{assignment.submissions.length} submitted</span>
                      <span>{gradedCount} graded</span>
                    </div>
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => setSelectedAssignment(assignment)}>
                      Review Submissions
                    </Button>
                  </>
                ) : mySubmission?.status === "graded" ? (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                    <p className="text-sm font-semibold text-white">
                      {mySubmission.score}/{assignment.maxScore}
                    </p>
                    {mySubmission.comments && <p className="text-xs text-slate-500 mt-1">{mySubmission.comments}</p>}
                  </div>
                ) : mySubmission?.status === "submitted" ? (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-sky-300 bg-sky-500/10 rounded-xl py-2.5">
                    <Icon name="checkCircle" size={13} />
                    Submitted, awaiting grade
                  </div>
                ) : (
                  <Button size="sm" className="w-full" icon="send" onClick={() => handleStudentSubmit(assignment)} loading={isSaving}>
                    Submit Assignment
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
        {assignments.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Icon name="clipboard" size={28} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No assignments yet.</p>
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Assignment" description="Publish a new assignment for a course." size="lg">
        <AssignmentForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} submitting={isSaving} />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete assignment?"
        description={deleteTarget ? `This will permanently delete "${deleteTarget.title}" and all student submissions.` : ""}
        confirmLabel="Delete assignment"
        loading={isSaving}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Grade modal
// -----------------------------------------------------------------------------

function GradeModal({
  submission,
  maxScore,
  onClose,
  onSave,
  submitting,
}: {
  submission: AssignmentSubmission | null;
  maxScore: number;
  onClose: () => void;
  onSave: (score: number, comments: string) => Promise<void>;
  submitting: boolean;
}) {
  const [score, setScore] = useState(String(submission?.score ?? ""));
  const [comments, setComments] = useState(submission?.comments ?? "");

  async function handleSave() {
    const numScore = Number(score);
    if (Number.isNaN(numScore) || numScore < 0 || numScore > maxScore) return;
    await onSave(numScore, comments.trim());
  }

  return (
    <Modal open={submission !== null} onClose={onClose} title="Grade Submission" description={`Score out of ${maxScore}`} size="sm">
      {submission && (
        <div className="space-y-4" key={submission.id}>
          <Input label="Score" type="number" min={0} max={maxScore} value={score} onChange={(e) => setScore(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Feedback (optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-400/50 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all resize-none"
              placeholder="Add feedback for the student..."
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={submitting}>
              Save grade
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}