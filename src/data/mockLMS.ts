import type { Course, Lesson, CourseLevel } from "@/types";
import { SUBJECTS, TEACHERS, CLASSES } from "./mockCore";
import { makeRng, pick, randomInt, isoDateTime } from "./seedHelpers";

// =============================================================================
// MOCK DATA — LMS Courses & Lessons
// One course seeded per (subject, class) pairing for the first few classes,
// each with a realistic lesson sequence (mixed video/reading/quiz/assignment
// types) so the LMS module has real content to browse out of the box.
// =============================================================================

const rng = makeRng(303);

const LESSON_TITLE_TEMPLATES = [
  "Introduction and Overview", "Core Concepts", "Worked Examples", "Practice Problems",
  "Deep Dive: Advanced Topics", "Real-World Applications", "Common Mistakes to Avoid",
  "Review and Summary", "Interactive Exercise", "Case Study",
];

const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"];

function buildLessons(courseId: string, count: number): Lesson[] {
  const types: Lesson["type"][] = ["video", "reading", "video", "reading", "quiz", "video", "assignment"];
  return Array.from({ length: count }, (_, i) => ({
    id: `${courseId}_lsn_${i + 1}`,
    courseId,
    title: `${i + 1}. ${LESSON_TITLE_TEMPLATES[i % LESSON_TITLE_TEMPLATES.length]}`,
    order: i + 1,
    durationMinutes: randomInt(rng, 8, 35),
    type: types[i % types.length],
    completed: false,
  }));
}

const COURSE_DEFS: { subjectIndex: number; classIndex: number; title: string; description: string }[] = [
  { subjectIndex: 0, classIndex: 7, title: "Algebra Foundations", description: "Master linear equations, inequalities, and graphing fundamentals." },
  { subjectIndex: 0, classIndex: 8, title: "Quadratic Functions", description: "Explore parabolas, factoring, and the quadratic formula in depth." },
  { subjectIndex: 1, classIndex: 7, title: "Essay Writing Essentials", description: "Structure, argumentation, and voice for effective academic essays." },
  { subjectIndex: 2, classIndex: 7, title: "Mechanics & Motion", description: "Newton's laws, kinematics, and forces through worked problems." },
  { subjectIndex: 2, classIndex: 8, title: "Waves & Optics", description: "Sound, light, and wave behavior with hands-on lab simulations." },
  { subjectIndex: 3, classIndex: 7, title: "Chemical Reactions", description: "Balancing equations, stoichiometry, and reaction types." },
  { subjectIndex: 4, classIndex: 7, title: "Cell Biology Basics", description: "Cell structure, function, and the building blocks of life." },
  { subjectIndex: 5, classIndex: 8, title: "Intro to Programming", description: "Variables, loops, and logic using beginner-friendly examples." },
  { subjectIndex: 5, classIndex: 9, title: "Data Structures 101", description: "Arrays, lists, and stacks — how programs organize information." },
  { subjectIndex: 8, classIndex: 6, title: "Urdu Grammar Essentials", description: "Sentence structure and grammar rules for fluent writing." },
  { subjectIndex: 6, classIndex: 8, title: "World History: 20th Century", description: "Major events, movements, and turning points of the modern era." },
  { subjectIndex: 3, classIndex: 8, title: "Organic Chemistry Intro", description: "Carbon compounds, functional groups, and naming conventions." },
];

const THUMBNAIL_COLORS = ["indigo", "sky", "emerald", "amber", "rose", "violet", "cyan", "teal"];

export const COURSES: Course[] = COURSE_DEFS.map((def, i) => {
  const subject = SUBJECTS[def.subjectIndex];
  const cls = CLASSES[def.classIndex];
  const teacher = pick(rng, TEACHERS.filter((t) => t.subjectIds.includes(subject.id)).length > 0 ? TEACHERS.filter((t) => t.subjectIds.includes(subject.id)) : TEACHERS);
  const id = `course_${i + 1}`;
  const lessonCount = randomInt(rng, 5, 9);
  const lessons = buildLessons(id, lessonCount);

  // Enroll every student from every section of this class (resolved lazily by the module via classId, not stored here as IDs to avoid a heavy cross-import — the module reads students by classId directly).
  return {
    id,
    title: def.title,
    description: def.description,
    subjectId: subject.id,
    teacherId: teacher.id,
    classId: cls.id,
    level: pick(rng, LEVELS),
    thumbnailColor: THUMBNAIL_COLORS[i % THUMBNAIL_COLORS.length],
    lessons,
    enrolledStudentIds: [],
    progressByStudent: {},
    certificateIssued: [],
    createdAt: isoDateTime(2026, 2, randomInt(rng, 1, 28)),
    updatedAt: isoDateTime(2026, 6, randomInt(rng, 1, 28)),
  };
});

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}