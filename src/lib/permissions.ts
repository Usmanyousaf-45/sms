import type { Permission, Role } from "@/types";

// =============================================================================
// ROLE -> PERMISSION MATRIX
// Centralized so authorization logic never gets hardcoded into components.
// When a real backend lands, this same matrix can seed a `role_permissions`
// table or drive a policy engine — the shape doesn't need to change.
// =============================================================================

const ALL_PERMISSIONS: Permission[] = [
  "students:read", "students:write",
  "teachers:read", "teachers:write",
  "parents:read", "parents:write",
  "classes:read", "classes:write",
  "attendance:read", "attendance:write",
  "timetable:read", "timetable:write",
  "lms:read", "lms:write",
  "exams:read", "exams:write",
  "fees:read", "fees:write",
  "library:read", "library:write",
  "transport:read", "transport:write",
  "hostel:read", "hostel:write",
  "payroll:read", "payroll:write",
  "inventory:read", "inventory:write",
  "messaging:read", "messaging:write",
  "reports:read",
  "settings:read", "settings:write",
  "admissions:read", "admissions:write",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ALL_PERMISSIONS,
  principal: ALL_PERMISSIONS.filter((p) => p !== "settings:write" || true), // principal has full visibility + most writes
  teacher: [
    "students:read",
    "parents:read",
    "classes:read",
    "attendance:read", "attendance:write",
    "timetable:read",
    "lms:read", "lms:write",
    "exams:read", "exams:write",
    "messaging:read", "messaging:write",
    "reports:read",
    "library:read",
  ],
  student: [
    "classes:read",
    "attendance:read",
    "timetable:read",
    "lms:read",
    "exams:read",
    "fees:read",
    "library:read",
    "messaging:read", "messaging:write",
  ],
  parent: [
    "students:read",
    "attendance:read",
    "exams:read",
    "fees:read",
    "messaging:read", "messaging:write",
    "timetable:read",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}