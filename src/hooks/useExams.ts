"use client";

import { useCallback, useEffect, useState } from "react";
import type { Exam, ExamResult, ExamStatus } from "@/types";
import { EXAMS as INITIAL_EXAMS, EXAM_RESULTS as INITIAL_RESULTS, getStudentsByClass } from "@/data";
import { generateId, sleep, gradeFromPercentage, round1 } from "@/lib/utils";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";

const EXAMS_KEY = "exams";
const RESULTS_KEY = "exam_results";

// =============================================================================
// useExams
// Exams own a subjectSchedule (nested, like Class/Section). Results are a
// separate flat collection keyed by (examId, studentId, subjectId) — mirrors
// how this would be its own `exam_results` table in a real schema, since
// results are entered incrementally (subject by subject) rather than as part
// of the exam record itself.
// =============================================================================

export interface ExamFormInput {
  name: string;
  classId: string;
  term: string;
  startDate: string;
  endDate: string;
  subjectIds: string[];
  maxMarks: number;
}

export function useExams() {
  const [exams, setExams] = useState<Exam[]>(() => loadFromStorage<Exam[]>(EXAMS_KEY, INITIAL_EXAMS));
  const [results, setResults] = useState<ExamResult[]>(() => loadFromStorage<ExamResult[]>(RESULTS_KEY, INITIAL_RESULTS));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExams(loadFromStorage<Exam[]>(EXAMS_KEY, INITIAL_EXAMS));
    setResults(loadFromStorage<ExamResult[]>(RESULTS_KEY, INITIAL_RESULTS));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(EXAMS_KEY, exams);
  }, [exams, hydrated]);

  useEffect(() => {
    if (hydrated) saveToStorage(RESULTS_KEY, results);
  }, [results, hydrated]);

  const createExam = useCallback(async (input: ExamFormInput): Promise<Exam> => {
    setIsSaving(true);
    await sleep(450);
    const now = new Date().toISOString();
    const newExam: Exam = {
      id: generateId("exam"),
      name: input.name,
      classId: input.classId,
      term: input.term,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "scheduled",
      subjectSchedule: input.subjectIds.map((subjectId, i) => ({
        subjectId,
        date: input.startDate,
        maxMarks: input.maxMarks,
      })).map((s, i) => ({ ...s, date: offsetDate(input.startDate, i) })),
      createdAt: now,
      updatedAt: now,
    };
    setExams((prev) => [newExam, ...prev]);
    setIsSaving(false);
    return newExam;
  }, []);

  const deleteExam = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setExams((prev) => prev.filter((e) => e.id !== id));
    setResults((prev) => prev.filter((r) => r.examId !== id));
    setIsSaving(false);
  }, []);

  const updateExamStatus = useCallback(async (id: string, status: ExamStatus): Promise<void> => {
    setIsSaving(true);
    await sleep(350);
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e)));
    setIsSaving(false);
  }, []);

  /** Upserts a single student's marks for one subject of an exam. */
  const enterMarks = useCallback(async (examId: string, studentId: string, subjectId: string, marksObtained: number, maxMarks: number): Promise<void> => {
    setIsSaving(true);
    await sleep(300);
    const grade = gradeFromPercentage((marksObtained / maxMarks) * 100);
    setResults((prev) => {
      const existingIdx = prev.findIndex((r) => r.examId === examId && r.studentId === studentId && r.subjectId === subjectId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], marksObtained, maxMarks, grade };
        return next;
      }
      return [...prev, { id: generateId("result"), examId, studentId, subjectId, marksObtained, maxMarks, grade }];
    });
    setIsSaving(false);
  }, []);

  const getResultsForExam = useCallback((examId: string): ExamResult[] => results.filter((r) => r.examId === examId), [results]);

  const getResultsForStudent = useCallback((examId: string, studentId: string): ExamResult[] => results.filter((r) => r.examId === examId && r.studentId === studentId), [results]);

  /** Ranking: total marks per student for an exam, sorted descending. */
  const getRanking = useCallback(
    (exam: Exam): { studentId: string; totalObtained: number; totalMax: number; percentage: number; rank: number }[] => {
      const students = getStudentsByClass(exam.classId);
      const rows = students.map((student) => {
        const studentResults = results.filter((r) => r.examId === exam.id && r.studentId === student.id);
        const totalObtained = studentResults.reduce((sum, r) => sum + r.marksObtained, 0);
        const totalMax = studentResults.reduce((sum, r) => sum + r.maxMarks, 0);
        const percentage = totalMax > 0 ? round1((totalObtained / totalMax) * 100) : 0;
        return { studentId: student.id, totalObtained, totalMax, percentage };
      });
      const sorted = rows.filter((r) => r.totalMax > 0).sort((a, b) => b.percentage - a.percentage);
      return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
    },
    [results]
  );

  return { exams, results, isSaving, createExam, deleteExam, updateExamStatus, enterMarks, getResultsForExam, getResultsForStudent, getRanking };
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}