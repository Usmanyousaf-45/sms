import type { NavItem, Role } from "@/types";

// =============================================================================
// NAVIGATION CONFIG
// Single source of truth for the sidebar. Grouped for rendering section
// headers; filtering by role happens at render time via `roles`.
// =============================================================================

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ALL_ROLES: Role[] = ["admin", "principal", "teacher", "student", "parent"];
const STAFF_ROLES: Role[] = ["admin", "principal", "teacher"];
const ADMIN_ROLES: Role[] = ["admin", "principal"];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: "grid", roles: ALL_ROLES },
    ],
  },
  {
    label: "People",
    items: [
      { key: "students", label: "Students", icon: "users", roles: [...ADMIN_ROLES, "teacher"] },
      { key: "teachers", label: "Teachers", icon: "briefcase", roles: ADMIN_ROLES },
      { key: "parents", label: "Parents", icon: "userGroup", roles: ADMIN_ROLES },
      { key: "admissions", label: "Admissions", icon: "userPlus", roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Academics",
    items: [
      { key: "classes", label: "Classes & Sections", icon: "layers", roles: ADMIN_ROLES },
      { key: "attendance", label: "Attendance", icon: "checkSquare", roles: STAFF_ROLES.concat("parent", "student") },
      { key: "timetable", label: "Timetable", icon: "calendar", roles: ALL_ROLES },
      { key: "exams", label: "Exams & Results", icon: "award", roles: ALL_ROLES },
      { key: "homework", label: "Homework", icon: "bookOpen", roles: ALL_ROLES },
      { key: "assignments", label: "Assignments", icon: "clipboard", roles: ALL_ROLES },
    ],
  },
  {
    label: "Learning (LMS)",
    items: [
      { key: "lms", label: "Courses", icon: "graduationCap", roles: ALL_ROLES },
      { key: "quizzes", label: "Quizzes", icon: "helpCircle", roles: ALL_ROLES },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "fees", label: "Fee Management", icon: "creditCard", roles: [...ADMIN_ROLES, "parent", "student"] },
      { key: "library", label: "Library", icon: "book", roles: ALL_ROLES },
      { key: "transport", label: "Transport", icon: "truck", roles: [...ADMIN_ROLES, "parent"] },
      { key: "hostel", label: "Hostel", icon: "home", roles: ADMIN_ROLES },
      { key: "payroll", label: "Payroll", icon: "wallet", roles: ADMIN_ROLES },
      { key: "inventory", label: "Inventory", icon: "box", roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Engagement",
    items: [
      { key: "events", label: "Events", icon: "star", roles: ALL_ROLES },
      { key: "notices", label: "Notice Board", icon: "megaphone", roles: ALL_ROLES },
      { key: "messaging", label: "Messaging", icon: "messageCircle", roles: ALL_ROLES },
    ],
  },
  {
    label: "Insights",
    items: [
      { key: "reports", label: "Reports", icon: "barChart", roles: STAFF_ROLES },
      { key: "ai", label: "AI Assistant", icon: "sparkles", roles: ALL_ROLES },
    ],
  },
  {
    label: "System",
    items: [
      { key: "settings", label: "Settings", icon: "settings", roles: ALL_ROLES },
    ],
  },
];

export function getNavGroupsForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}