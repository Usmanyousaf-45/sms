"use client";

import { useEffect, useState } from "react";
import type { Quiz } from "@/types";
import { QUIZZES, getSubjectById, getStudentById } from "@/data";
import { useQuizAttempts } from "@/hooks/useQuizAttempts";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/store/ToastContext";
import { cn, round1 } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";

// =============================================================================
// QUIZ MODULE
// Three states per quiz: list -> taking (timed, one question at a time) ->
// result (score + review). Leaderboard shown after submission, sourced from
// every student's best attempt. Retry respects attemptsAllowed.
// =============================================================================

type ViewState = { mode: "list" } | { mode: "taking"; quiz: Quiz } | { mode: "result"; quiz: Quiz; score: number; total: number };

export function QuizModule() {
  const { session } = useAuth();
  const { getAttemptsForQuiz, submitAttempt, getLeaderboard, isSaving } = useQuizAttempts();
  const toast = useToast();
  const [view, setView] = useState<ViewState>({ mode: "list" });

  if (!session) return null;
  const studentId = session.user.linkedEntityId ?? session.user.id;

  if (view.mode === "taking") {
    return (
      <QuizTaking
        quiz={view.quiz}
        onSubmit={async (answers) => {
          const attempt = await submitAttempt({ quizId: view.quiz.id, studentId, answers });
          setView({ mode: "result", quiz: view.quiz, score: attempt.score, total: attempt.totalQuestions });
        }}
        onCancel={() => setView({ mode: "list" })}
        submitting={isSaving}
      />
    );
  }

  if (view.mode === "result") {
    const leaderboard = getLeaderboard(view.quiz.id);
    const attemptsUsed = getAttemptsForQuiz(view.quiz.id, studentId).length;
    const canRetry = attemptsUsed < view.quiz.attemptsAllowed;
    return (
      <QuizResult
        quiz={view.quiz}
        score={view.score}
        total={view.total}
        leaderboard={leaderboard}
        canRetry={canRetry}
        attemptsUsed={attemptsUsed}
        onRetry={() => setView({ mode: "taking", quiz: view.quiz })}
        onBack={() => setView({ mode: "list" })}
      />
    );
  }

  return (
    <QuizList
      onStart={(quiz) => {
        const used = getAttemptsForQuiz(quiz.id, studentId).length;
        if (used >= quiz.attemptsAllowed) {
          toast.warning("No attempts remaining", `You've used all ${quiz.attemptsAllowed} attempts for this quiz.`);
          return;
        }
        setView({ mode: "taking", quiz });
      }}
      getAttemptsUsed={(quizId) => getAttemptsForQuiz(quizId, studentId).length}
    />
  );
}

// -----------------------------------------------------------------------------
// List view
// -----------------------------------------------------------------------------

function QuizList({ onStart, getAttemptsUsed }: { onStart: (quiz: Quiz) => void; getAttemptsUsed: (quizId: string) => number }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">Quizzes</h2>
        <p className="text-sm text-slate-400 mt-0.5">{QUIZZES.length} quizzes available across all subjects</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUIZZES.map((quiz) => {
          const subject = getSubjectById(quiz.subjectId);
          const used = getAttemptsUsed(quiz.id);
          const remaining = quiz.attemptsAllowed - used;
          return (
            <Card key={quiz.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center text-indigo-300">
                  <Icon name="helpCircle" size={18} />
                </div>
                <Badge variant={remaining > 0 ? "success" : "neutral"}>{remaining > 0 ? `${remaining} left` : "No attempts left"}</Badge>
              </div>
              <h3 className="text-base font-semibold text-white leading-snug">{quiz.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{subject?.name}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Icon name="clock" size={12} />
                  {quiz.timeLimitMinutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="clipboard" size={12} />
                  {quiz.questions.length} questions
                </span>
              </div>
              <Button className="mt-4 w-full" size="sm" icon="play" onClick={() => onStart(quiz)} disabled={remaining <= 0}>
                {used > 0 ? "Retry Quiz" : "Start Quiz"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Taking view (timed, one question at a time)
// -----------------------------------------------------------------------------

function QuizTaking({
  quiz,
  onSubmit,
  onCancel,
  submitting,
}: {
  quiz: Quiz;
  onSubmit: (answers: Record<string, number>) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(quiz.timeLimitMinutes * 60);

  const question = quiz.questions[index];
  const isLast = index === quiz.questions.length - 1;

  useEffect(() => {
    if (secondsLeft <= 0) {
      onSubmit(answers);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const lowTime = secondsLeft < 60;

  function selectAnswer(optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
          <Icon name="arrowLeft" size={13} />
          Exit quiz
        </button>
        <div className={cn("flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full", lowTime ? "bg-rose-500/15 text-rose-300" : "bg-white/[0.06] text-slate-300")}>
          <Icon name="clock" size={14} />
          {minutes}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">
            Question {index + 1} of {quiz.questions.length}
          </span>
          <span className="text-xs text-slate-500">{quiz.title}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }} />
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-white mb-5">{question.question}</h3>
        <div className="space-y-2.5">
          {question.options.map((option, i) => {
            const selected = answers[question.id] === i;
            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3",
                  selected ? "bg-indigo-500/15 border-indigo-400/50 text-white" : "bg-white/[0.03] border-white/[0.07] text-slate-300 hover:bg-white/[0.06]"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium flex-shrink-0",
                    selected ? "bg-indigo-500 border-indigo-500 text-white" : "border-white/20 text-slate-500"
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          Previous
        </Button>
        {isLast ? (
          <Button icon="check" onClick={() => onSubmit(answers)} loading={submitting}>
            Submit Quiz
          </Button>
        ) : (
          <Button icon="arrowRight" iconPosition="right" onClick={() => setIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Result view
// -----------------------------------------------------------------------------

function QuizResult({
  quiz,
  score,
  total,
  leaderboard,
  canRetry,
  attemptsUsed,
  onRetry,
  onBack,
}: {
  quiz: Quiz;
  score: number;
  total: number;
  leaderboard: { studentId: string; bestScore: number; totalQuestions: number }[];
  canRetry: boolean;
  attemptsUsed: number;
  onRetry: () => void;
  onBack: () => void;
}) {
  const pct = total > 0 ? round1((score / total) * 100) : 0;
  const passed = pct >= 50;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <Card className="text-center !py-10">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", passed ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400")}>
          <Icon name={passed ? "checkCircle" : "alertCircle"} size={28} />
        </div>
        <h2 className="text-2xl font-semibold text-white">
          {score} / {total}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{pct}% · {passed ? "Well done!" : "Keep practicing"}</p>
        <p className="text-xs text-slate-500 mt-4">
          {quiz.title} · Attempt {attemptsUsed} of {quiz.attemptsAllowed}
        </p>
        <div className="flex items-center justify-center gap-2.5 mt-6">
          <Button variant="secondary" onClick={onBack}>
            Back to Quizzes
          </Button>
          {canRetry && (
            <Button icon="refreshCw" onClick={onRetry}>
              Retry Quiz
            </Button>
          )}
        </div>
      </Card>

      <Card title="Leaderboard">
        <div className="space-y-2">
          {leaderboard.slice(0, 8).map((entry, i) => {
            const student = getStudentById(entry.studentId);
            return (
              <div key={entry.studentId} className="flex items-center gap-3 py-1.5">
                <span
                  className={cn(
                    "w-6 text-xs font-semibold text-center flex-shrink-0",
                    i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-slate-600"
                  )}
                >
                  #{i + 1}
                </span>
                <span className="text-sm text-slate-300 flex-1 truncate">{student ? `${student.firstName} ${student.lastName}` : "Student"}</span>
                <span className="text-sm font-medium text-white">
                  {entry.bestScore}/{entry.totalQuestions}
                </span>
              </div>
            );
          })}
          {leaderboard.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No attempts recorded yet.</p>}
        </div>
      </Card>
    </div>
  );
}