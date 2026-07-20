import type { Quiz, QuizQuestion } from "@/types";
import { SUBJECTS } from "./mockCore";
import { makeRng, randomInt } from "./seedHelpers";

// =============================================================================
// MOCK DATA — Quizzes
// A handful of seeded quizzes with real question banks so the Quiz module
// has content to take/review out of the box.
// =============================================================================

const rng = makeRng(404);

function q(id: string, question: string, options: string[], correctOptionIndex: number): QuizQuestion {
  return { id, question, options, correctOptionIndex };
}

const QUIZ_DEFS: { subjectName: string; title: string; timeLimitMinutes: number; questions: QuizQuestion[] }[] = [
  {
    subjectName: "Mathematics",
    title: "Algebra Basics Quiz",
    timeLimitMinutes: 15,
    questions: [
      q("q1", "Solve for x: 2x + 6 = 14", ["x = 3", "x = 4", "x = 5", "x = 6"], 1),
      q("q2", "What is the slope of the line y = 3x + 2?", ["2", "3", "5", "-3"], 1),
      q("q3", "Simplify: 3(x + 4) - 2x", ["x + 12", "x + 4", "5x + 4", "x - 12"], 0),
      q("q4", "Which of these is a quadratic equation?", ["y = 2x + 1", "y = x² + 3", "y = 5", "y = 1/x"], 1),
      q("q5", "What is 4² + 3²?", ["25", "49", "12", "7"], 0),
    ],
  },
  {
    subjectName: "Physics",
    title: "Forces & Motion Quiz",
    timeLimitMinutes: 20,
    questions: [
      q("q1", "What is Newton's First Law also known as?", ["Law of Acceleration", "Law of Inertia", "Law of Gravity", "Law of Action-Reaction"], 1),
      q("q2", "Unit of force in the SI system?", ["Joule", "Watt", "Newton", "Pascal"], 2),
      q("q3", "An object at rest stays at rest unless acted upon by...", ["Time", "An unbalanced force", "Gravity only", "Friction only"], 1),
      q("q4", "What is the formula for force?", ["F = ma", "F = mv", "F = m/a", "F = a/m"], 0),
    ],
  },
  {
    subjectName: "Chemistry",
    title: "Chemical Reactions Quiz",
    timeLimitMinutes: 15,
    questions: [
      q("q1", "What type of reaction releases heat?", ["Endothermic", "Exothermic", "Neutral", "Catalytic"], 1),
      q("q2", "What is the chemical symbol for Sodium?", ["So", "Na", "S", "Sd"], 1),
      q("q3", "Balancing equations follows which law?", ["Law of Gravity", "Conservation of Mass", "Law of Motion", "Ohm's Law"], 1),
      q("q4", "What gas is produced when acid reacts with a metal?", ["Oxygen", "Hydrogen", "Nitrogen", "Carbon dioxide"], 1),
    ],
  },
  {
    subjectName: "English Language",
    title: "Grammar & Comprehension Quiz",
    timeLimitMinutes: 12,
    questions: [
      q("q1", "Identify the noun: 'The quick fox jumps.'", ["Quick", "Fox", "Jumps", "The"], 1),
      q("q2", "Which sentence is grammatically correct?", ["She don't like tea.", "She doesn't likes tea.", "She doesn't like tea.", "She not like tea."], 2),
      q("q3", "What is a synonym for 'happy'?", ["Sad", "Joyful", "Angry", "Tired"], 1),
      q("q4", "Which word is an adverb?", ["Quickly", "Quick", "Quickness", "Quicken"], 0),
    ],
  },
  {
    subjectName: "Computer Science",
    title: "Programming Fundamentals Quiz",
    timeLimitMinutes: 18,
    questions: [
      q("q1", "What does 'loop' mean in programming?", ["A single decision", "Repeating a block of code", "A type of variable", "A syntax error"], 1),
      q("q2", "Which of these is a data type?", ["Loop", "Integer", "Function", "Condition"], 1),
      q("q3", "What symbol typically starts a comment in many languages?", ["#", "@", "$", "%"], 0),
      q("q4", "What does 'if' represent in code?", ["A loop", "A conditional statement", "A variable", "A function call"], 1),
    ],
  },
];

export const QUIZZES: Quiz[] = QUIZ_DEFS.map((def, i) => {
  const subject = SUBJECTS.find((s) => s.name === def.subjectName) ?? SUBJECTS[0];
  return {
    id: `quiz_${i + 1}`,
    title: def.title,
    subjectId: subject.id,
    timeLimitMinutes: def.timeLimitMinutes,
    questions: def.questions,
    attemptsAllowed: randomInt(rng, 2, 3),
  };
});

export function getQuizById(id: string): Quiz | undefined {
  return QUIZZES.find((q) => q.id === id);
}