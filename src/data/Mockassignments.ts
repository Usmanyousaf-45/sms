import type { Assignment, AssignmentSubmission } from "@/types";
import { COURSES } from "./mockLMS";
import { getStudentsByClass } from "./mockCore";
import { makeRng, pick, randomInt, daysAgoDateOnly, daysFromNowDateOnly } from "./seedHelpers";

// =============================================================================
// MOCK DATA — Assignments
// Seeded from a subset of courses so the Assignments module has real content
// and realistic submission states (pending/submitted/graded/late) out of the
// box, without requiring the user to create everything from scratch.
// =============================================================================

const rng = makeRng(505);

// local deterministic id generator using the same rng so seeds remain stable
function generateId(prefix = "id") {
  // use rng to produce a small base36 token
  const token = Math.floor(rng() * 0x100000000).toString(36);
  return `${prefix}_${token}`;
}

const ASSIGNMENT_TITLES = [
  "Problem Set 1", "Research Summary", "Chapter Review", "Practical Exercise",
  "Case Study Analysis", "Homework Extension", "Group Project Outline", "Reflection Paper",
];

function buildSubmissions(assignmentId: string, classId: string, maxScore: number): AssignmentSubmission[] {
  const students = getStudentsByClass(classId).slice(0, 12); // sample subset for seed data
  return students.map((student) => {
    const status = pick(rng, ["pending", "submitted", "graded", "graded", "late"] as const);
    const submitted = status !== "pending";
    return {
      id: generateId("asub"),
      assignmentId,
      studentId: student.id,
      status,
      score: status === "graded" ? randomInt(rng, Math.round(maxScore * 0.5), maxScore) : undefined,
      comments: status === "graded" ? pick(rng, ["Good work!", "Well structured.", "Needs more detail.", "Great effort.", "Review section 2."]) : undefined,
      submittedAt: submitted ? daysAgoDateOnly(randomInt(rng, 0, 5), 2026, 7, 19) : undefined,
    };
  });
}

export const ASSIGNMENTS: Assignment[] = COURSES.slice(0, 8).map((course, i) => {
  const id = `assign_${i + 1}`;
  const maxScore = pick(rng, [20, 25, 50, 100]);
  const dueInFuture = rng() > 0.4;
  return {
    id,
    title: `${course.title.split(" ")[0]} ${pick(rng, ASSIGNMENT_TITLES)}`,
    courseId: course.id,
    description: `Complete the assigned work for "${course.title}" and submit before the due date.`,
    dueDate: dueInFuture ? daysFromNowDateOnly(randomInt(rng, 2, 14), 2026, 7, 19) : daysAgoDateOnly(randomInt(rng, 1, 10), 2026, 7, 19),
    maxScore,
    submissions: buildSubmissions(id, course.classId, maxScore),
  };
});

export function getAssignmentById(id: string): Assignment | undefined {
  return ASSIGNMENTS.find((a) => a.id === id);
}