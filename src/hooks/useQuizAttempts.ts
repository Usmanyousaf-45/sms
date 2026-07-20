"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuizAttempt } from "@/types";
import { QUIZZES } from "@/data";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";
import { generateId, sleep } from "@/lib/utils";

const STORAGE_KEY = "quiz_attempts";

// =============================================================================
// useQuizAttempts
// Tracks every quiz attempt (score, answers, timestamp) per student. Supports
// the "attemptsAllowed" cap per quiz and derives a leaderboard from the best
// score per student for a given quiz.
// =============================================================================

export function useQuizAttempts() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => loadFromStorage<QuizAttempt[]>(STORAGE_KEY, []));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAttempts(loadFromStorage<QuizAttempt[]>(STORAGE_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY, attempts);
  }, [attempts, hydrated]);

  const getAttemptsForQuiz = useCallback(
    (quizId: string, studentId: string): QuizAttempt[] => attempts.filter((a) => a.quizId === quizId && a.studentId === studentId),
    [attempts]
  );

  const submitAttempt = useCallback(
    async (params: { quizId: string; studentId: string; answers: Record<string, number> }): Promise<QuizAttempt> => {
      setIsSaving(true);
      await sleep(500);
      const quiz = QUIZZES.find((q) => q.id === params.quizId);
      const totalQuestions = quiz?.questions.length ?? 0;
      const score = quiz
        ? quiz.questions.filter((q) => params.answers[q.id] === q.correctOptionIndex).length
        : 0;

      const attempt: QuizAttempt = {
        id: generateId("attempt"),
        quizId: params.quizId,
        studentId: params.studentId,
        score,
        totalQuestions,
        submittedAt: new Date().toISOString(),
        answers: params.answers,
      };

      setAttempts((prev) => [attempt, ...prev]);
      setIsSaving(false);
      return attempt;
    },
    []
  );

  /** Best score per student for a quiz, sorted descending — used for the leaderboard. */
  const getLeaderboard = useCallback(
    (quizId: string): { studentId: string; bestScore: number; totalQuestions: number }[] => {
      const relevant = attempts.filter((a) => a.quizId === quizId);
      const bestByStudent = new Map<string, QuizAttempt>();
      relevant.forEach((a) => {
        const existing = bestByStudent.get(a.studentId);
        if (!existing || a.score > existing.score) bestByStudent.set(a.studentId, a);
      });
      return Array.from(bestByStudent.values())
        .map((a) => ({ studentId: a.studentId, bestScore: a.score, totalQuestions: a.totalQuestions }))
        .sort((a, b) => b.bestScore - a.bestScore);
    },
    [attempts]
  );

  return { attempts, isSaving, getAttemptsForQuiz, submitAttempt, getLeaderboard };
}