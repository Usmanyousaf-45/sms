import type {
  Subject,
  SchoolClass,
  ClassSection,
  Teacher,
  Student,
  Parent,
  Gender,
} from "@/types";
import {
  makeRng,
  pick,
  pickMany,
  randomInt,
  randomFloat,
  generateFullName,
  withAvatar,
  isoDate,
  isoDateTime,
  generateAddress,
  SUBJECT_DEFINITIONS,
} from "./seedHelpers";

// =============================================================================
// CORE MOCK DATA — Subjects, Classes/Sections, Teachers, Students, Parents
// All entities are cross-linked by ID exactly as a relational schema would
// enforce via foreign keys, so downstream modules (attendance, exams, fees...)
// can join against them naturally.
// =============================================================================

const rng = makeRng(42);

// -----------------------------------------------------------------------------
// Subjects
// -----------------------------------------------------------------------------

export const SUBJECTS: Subject[] = SUBJECT_DEFINITIONS.map((def, i) => ({
  id: `subj_${i + 1}`,
  name: def.name,
  code: def.code,
  color: def.color,
  classIds: [], // populated after classes are generated
  createdAt: isoDateTime(2024, 1, 10),
  updatedAt: isoDateTime(2024, 1, 10),
}));

// -----------------------------------------------------------------------------
// Teachers (generated first so classes/sections can assign class teachers)
// -----------------------------------------------------------------------------

const TEACHER_COUNT = 24;

export const TEACHERS: Teacher[] = Array.from({ length: TEACHER_COUNT }, (_, i) => {
  const { firstName, lastName, gender } = generateFullName(rng);
  const id = `tch_${i + 1}`;
  const subjectIds = pickMany(rng, SUBJECTS, randomInt(rng, 1, 3)).map((s) => s.id);
  const base: Omit<Teacher, "avatarColor" | "avatarInitials"> = {
    id,
    teacherCode: `TCH-${String(i + 1).padStart(4, "0")}`,
    firstName,
    lastName,
    gender: gender as Gender,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@brightfield.edu.pk`,
    phone: `+92 3${randomInt(rng, 10, 99)} ${randomInt(rng, 1000000, 9999999)}`,
    address: generateAddress(rng),
    subjectIds,
    assignedClassIds: [],
    qualification: pick(rng, ["M.Ed", "M.Phil", "M.Sc", "B.Ed", "MA Education", "Ph.D"]),
    experienceYears: randomInt(rng, 1, 22),
    salary: randomInt(rng, 55000, 180000),
    employmentType: pick(rng, ["full-time", "full-time", "full-time", "part-time", "contract"]),
    joinDate: isoDate(randomInt(rng, 2015, 2025), randomInt(rng, 1, 12), randomInt(rng, 1, 28)),
    attendancePercentage: randomFloat(rng, 88, 100),
    performanceRating: randomFloat(rng, 3.2, 5.0),
    status: pick(rng, ["active", "active", "active", "active", "on-leave"]),
    isArchived: false,
    createdAt: isoDateTime(2024, 1, 10),
    updatedAt: isoDateTime(2026, 6, 1),
  };
  return withAvatar(base);
});

// -----------------------------------------------------------------------------
// Classes & Sections
// -----------------------------------------------------------------------------

const GRADE_NAMES = [
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10",
];
const SECTION_NAMES = ["A", "B", "C"];

let teacherCursor = 0;
function nextTeacher(): Teacher {
  const t = TEACHERS[teacherCursor % TEACHERS.length];
  teacherCursor += 1;
  return t;
}

export const CLASSES: SchoolClass[] = GRADE_NAMES.map((name, gradeIdx) => {
  const classId = `cls_${gradeIdx + 1}`;
  const subjectIds = pickMany(rng, SUBJECTS, randomInt(rng, 6, 9)).map((s) => s.id);
  const sectionCount = gradeIdx < 6 ? 3 : 2;

  const sections: ClassSection[] = Array.from({ length: sectionCount }, (_, sIdx) => {
    const teacher = nextTeacher();
    const sectionId = `sec_${classId}_${SECTION_NAMES[sIdx]}`;
    teacher.assignedClassIds.push(sectionId);
    return {
      id: sectionId,
      classId,
      name: SECTION_NAMES[sIdx],
      capacity: 35,
      classTeacherId: teacher.id,
      studentCount: 0, // computed after students are generated
      roomNumber: `${gradeIdx + 1}0${sIdx + 1}`,
      createdAt: isoDateTime(2024, 1, 10),
      updatedAt: isoDateTime(2024, 1, 10),
    };
  });

  return {
    id: classId,
    name,
    gradeLevel: gradeIdx + 1,
    sections,
    subjectIds,
    createdAt: isoDateTime(2024, 1, 10),
    updatedAt: isoDateTime(2024, 1, 10),
  };
});

// backfill subject -> classIds
CLASSES.forEach((cls) => {
  cls.subjectIds.forEach((subId) => {
    const subject = SUBJECTS.find((s) => s.id === subId);
    if (subject && !subject.classIds.includes(cls.id)) subject.classIds.push(cls.id);
  });
});

export const ALL_SECTIONS: ClassSection[] = CLASSES.flatMap((c) => c.sections);

export function getClassById(id: string): SchoolClass | undefined {
  return CLASSES.find((c) => c.id === id);
}
export function getSectionById(id: string): ClassSection | undefined {
  return ALL_SECTIONS.find((s) => s.id === id);
}
export function getSubjectById(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}
export function getTeacherById(id: string): Teacher | undefined {
  return TEACHERS.find((t) => t.id === id);
}

// -----------------------------------------------------------------------------
// Students
// -----------------------------------------------------------------------------

const GUARDIAN_RELATIONS = ["Father", "Mother", "Guardian", "Grandfather", "Grandmother"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

let studentSeq = 0;
const STUDENTS: Student[] = [];

ALL_SECTIONS.forEach((section) => {
  const studentsInSection = randomInt(rng, 22, 32);
  for (let i = 0; i < studentsInSection; i++) {
    studentSeq += 1;
    const { firstName, lastName, gender } = generateFullName(rng);
    const id = `stu_${studentSeq}`;
    const cls = getClassById(section.classId)!;
    const dobYear = 2026 - (cls.gradeLevel + 5); // rough age-per-grade mapping
    const status = pick(rng, ["active", "active", "active", "active", "active", "active", "active", "active", "active", "inactive"] as const);

    const base: Omit<Student, "avatarColor" | "avatarInitials"> = {
      id,
      studentCode: `STU-2026-${String(studentSeq).padStart(4, "0")}`,
      firstName,
      lastName,
      gender: gender as Gender,
      dob: isoDate(dobYear, randomInt(rng, 1, 12), randomInt(rng, 1, 28)),
      classId: section.classId,
      sectionId: section.id,
      rollNumber: String(i + 1).padStart(2, "0"),
      guardianName: `${pick(rng, ["Mr.", "Mrs.", "Dr."])} ${pick(rng, SUBJECT_DEFINITIONS).name === "" ? "" : ""}${lastName}`,
      guardianRelation: pick(rng, GUARDIAN_RELATIONS),
      parentId: undefined, // linked below once parents are generated
      phone: `+92 3${randomInt(rng, 10, 99)} ${randomInt(rng, 1000000, 9999999)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${studentSeq}@student.brightfield.edu.pk`,
      address: generateAddress(rng),
      attendancePercentage: randomFloat(rng, 72, 100),
      gpa: randomFloat(rng, 2.2, 4.0),
      status,
      admissionDate: isoDate(randomInt(rng, 2019, 2026), randomInt(rng, 1, 12), randomInt(rng, 1, 28)),
      bloodGroup: pick(rng, BLOOD_GROUPS),
      isArchived: false,
      createdAt: isoDateTime(2024, 1, 10),
      updatedAt: isoDateTime(2026, 6, 1),
    };
    STUDENTS.push(withAvatar(base));
    section.studentCount += 1;
  }
});

export { STUDENTS };

export function getStudentById(id: string): Student | undefined {
  return STUDENTS.find((s) => s.id === id);
}
export function getStudentsBySection(sectionId: string): Student[] {
  return STUDENTS.filter((s) => s.sectionId === sectionId);
}
export function getStudentsByClass(classId: string): Student[] {
  return STUDENTS.filter((s) => s.classId === classId);
}

// -----------------------------------------------------------------------------
// Parents — generated from a subset of students (siblings share a parent)
// -----------------------------------------------------------------------------

const PARENTS: Parent[] = [];
let parentSeq = 0;
const studentsPool = [...STUDENTS];

while (studentsPool.length > 0) {
  parentSeq += 1;
  const childCount = rng() > 0.75 ? 2 : 1;
  const children = studentsPool.splice(0, Math.min(childCount, studentsPool.length));
  const primaryChild = children[0];
  const id = `par_${parentSeq}`;
  const lastName = primaryChild.lastName;
  const { firstName, gender } = generateFullName(rng);

  const base: Omit<Parent, "avatarColor" | "avatarInitials"> = {
    id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${parentSeq}@gmail.com`,
    phone: primaryChild.phone,
    address: primaryChild.address,
    occupation: pick(rng, [
      "Business Owner", "Software Engineer", "Doctor", "Government Officer", "Teacher",
      "Accountant", "Architect", "Bank Manager", "Entrepreneur", "Consultant",
    ]),
    childStudentIds: children.map((c) => c.id),
    isArchived: false,
    createdAt: isoDateTime(2024, 1, 10),
    updatedAt: isoDateTime(2026, 6, 1),
  };
  const parent = withAvatar(base);
  PARENTS.push(parent);
  children.forEach((c) => {
    c.parentId = parent.id;
    c.guardianName = `${gender === "male" ? "Mr." : "Mrs."} ${firstName} ${lastName}`;
  });
  void gender;
}

export { PARENTS };

export function getParentById(id: string): Parent | undefined {
  return PARENTS.find((p) => p.id === id);
}
export function getParentByChildId(studentId: string): Parent | undefined {
  return PARENTS.find((p) => p.childStudentIds.includes(studentId));
}