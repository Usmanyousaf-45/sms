import type { AuthUser, Role } from "@/types";
import { getInitials, getAvatarGradient } from "@/lib/utils";
import { STUDENTS, TEACHERS, PARENTS } from "./mockCore";

// =============================================================================
// MOCK AUTH USERS
// One canonical demo login per role, plus the linked domain entity so e.g.
// the "student" demo login sees ITS OWN attendance/grades/fees, not generic
// placeholder data. This is what makes the auth simulation feel real.
// =============================================================================

const demoStudent = STUDENTS[0];
const demoTeacher = TEACHERS[0];
const demoParent = PARENTS[0];

function buildUser(partial: {
  id: string;
  name: string;
  email: string;
  role: Role;
  linkedEntityId?: string;
  phone?: string;
}): AuthUser {
  return {
    id: partial.id,
    name: partial.name,
    email: partial.email,
    role: partial.role,
    avatarColor: getAvatarGradient(partial.id),
    avatarInitials: getInitials(partial.name),
    linkedEntityId: partial.linkedEntityId,
    phone: partial.phone,
    isActive: true,
    lastLoginAt: "2026-07-19T08:15:00Z",
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2026-07-19T08:15:00Z",
  };
}

export const DEMO_USERS: Record<Role, AuthUser> = {
  admin: buildUser({
    id: "user_admin_1",
    name: "Sarah Ahmed",
    email: "admin@brightfield.edu.pk",
    role: "admin",
    phone: "+92 300 1234567",
  }),
  principal: buildUser({
    id: "user_principal_1",
    name: "Dr. Imran Malik",
    email: "principal@brightfield.edu.pk",
    role: "principal",
    phone: "+92 300 2345678",
  }),
  teacher: buildUser({
    id: "user_teacher_1",
    name: `${demoTeacher.firstName} ${demoTeacher.lastName}`,
    email: demoTeacher.email,
    role: "teacher",
    linkedEntityId: demoTeacher.id,
    phone: demoTeacher.phone,
  }),
  student: buildUser({
    id: "user_student_1",
    name: `${demoStudent.firstName} ${demoStudent.lastName}`,
    email: demoStudent.email,
    role: "student",
    linkedEntityId: demoStudent.id,
    phone: demoStudent.phone,
  }),
  parent: buildUser({
    id: "user_parent_1",
    name: `${demoParent.firstName} ${demoParent.lastName}`,
    email: demoParent.email,
    role: "parent",
    linkedEntityId: demoParent.id,
    phone: demoParent.phone,
  }),
};

/** Demo credentials shown on the login screen so users know what to type. */
export const DEMO_CREDENTIALS: { role: Role; email: string; password: string; label: string; description: string }[] = [
  { role: "admin", email: "admin@brightfield.edu.pk", password: "demo1234", label: "Admin", description: "Full system access" },
  { role: "principal", email: "principal@brightfield.edu.pk", password: "demo1234", label: "Principal", description: "School-wide oversight" },
  { role: "teacher", email: demoTeacher.email, password: "demo1234", label: "Teacher", description: "Class & LMS management" },
  { role: "student", email: demoStudent.email, password: "demo1234", label: "Student", description: "Learning & progress view" },
  { role: "parent", email: demoParent.email, password: "demo1234", label: "Parent", description: "Track your child" },
];

export function findUserByEmail(email: string): AuthUser | undefined {
  return Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
}