"use client";

import { useCallback, useEffect, useState } from "react";
import type { Assignment, AssignmentSubmission } from "@/types";
import { ASSIGNMENTS as INITIAL_ASSIGNMENTS, getStudentsByClass, getCourseById } from "@/data";
import { generateId, sleep } from "@/lib/utils";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";

const STORAGE_KEY = "assignments";

// =============================================================================
// useAssignments
// Assignments own a nested submissions collection (one per enrolled student,
// same nested pattern as Class/Section and Course/Lesson). Students "submit"
// (status flip, no real file upload per the attachments-placeholder spec);
// teachers grade with a score + comment.
// =============================================================================

export interface AssignmentFormInput {
  title: string;
  courseId: string;
  description: string;
  dueDate: string;
  maxScore: number;
}

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadFromStorage<Assignment[]>(STORAGE_KEY, INITIAL_ASSIGNMENTS));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAssignments(loadFromStorage<Assignment[]>(STORAGE_KEY, INITIAL_ASSIGNMENTS));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY, assignments);
  }, [assignments, hydrated]);

  const createAssignment = useCallback(async (input: AssignmentFormInput): Promise<Assignment> => {
    setIsSaving(true);
    await sleep(450);
    const id = generateId("assign");
    const course = getCourseById(input.courseId);
    const students = course ? getStudentsByClass(course.classId) : [];
    const submissions: AssignmentSubmission[] = students.map((s) => ({
      id: generateId("asub"),
      assignmentId: id,
      studentId: s.id,
      status: "pending",
    }));

    const newAssignment: Assignment = {
      id,
      title: input.title,
      courseId: input.courseId,
      description: input.description,
      dueDate: input.dueDate,
      maxScore: input.maxScore,
      submissions,
    };
    setAssignments((prev) => [newAssignment, ...prev]);
    setIsSaving(false);
    return newAssignment;
  }, []);

  const deleteAssignment = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setIsSaving(false);
  }, []);

  /** Student marks their own submission as submitted. */
  const submitAssignment = useCallback(async (assignmentId: string, studentId: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        const hasSubmission = a.submissions.some((s) => s.studentId === studentId);
        const nextSubmissions = hasSubmission
          ? a.submissions.map((s) => (s.studentId === studentId ? { ...s, status: "submitted" as const, submittedAt: new Date().toISOString() } : s))
          : [...a.submissions, { id: generateId("asub"), assignmentId, studentId, status: "submitted" as const, submittedAt: new Date().toISOString() }];
        return { ...a, submissions: nextSubmissions };
      })
    );
    setIsSaving(false);
  }, []);

  /** Teacher grades a student's submission. */
  const gradeSubmission = useCallback(
    async (assignmentId: string, submissionId: string, score: number, comments: string): Promise<void> => {
      setIsSaving(true);
      await sleep(400);
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, submissions: a.submissions.map((s) => (s.id === submissionId ? { ...s, status: "graded" as const, score, comments } : s)) }
            : a
        )
      );
      setIsSaving(false);
    },
    []
  );

  return { assignments, isSaving, createAssignment, deleteAssignment, submitAssignment, gradeSubmission };
}