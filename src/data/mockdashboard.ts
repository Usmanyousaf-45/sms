import { makeRng, randomInt, daysAgoISO, daysFromNowDateOnly, pick } from "./seedHelpers";
import { SUBJECTS, TEACHERS } from "./mockCore";
import type { IconName } from "@/components/ui/Icon";

// =============================================================================
// DASHBOARD MOCK DATA — activity feed, today's schedule, upcoming items
// =============================================================================

const rng = makeRng(202);

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  icon: IconName;
  time: string; // ISO
}

const ACTIVITY_TEMPLATES: { action: string; icon: IconName }[] = [
  { action: "marked attendance for", icon: "checkSquare" },
  { action: "graded an assignment in", icon: "clipboard" },
  { action: "published results for", icon: "award" },
  { action: "posted a notice in", icon: "megaphone" },
  { action: "uploaded a lesson to", icon: "bookOpen" },
  { action: "recorded a fee payment for", icon: "creditCard" },
  { action: "scheduled an exam for", icon: "calendar" },
  { action: "sent a message to", icon: "messageCircle" },
];

const TARGETS = ["Grade 8-A", "Grade 6-B", "Grade 10-A", "Grade 5-C", "Grade 9-B", "Grade 7-A", "the Physics class", "the Mathematics course"];

export const ACTIVITY_FEED: ActivityItem[] = Array.from({ length: 14 }, (_, i) => {
  const teacher = pick(rng, TEACHERS);
  const template = pick(rng, ACTIVITY_TEMPLATES);
  return {
    id: `activity_${i + 1}`,
    actor: `${teacher.firstName} ${teacher.lastName}`,
    action: template.action,
    target: pick(rng, TARGETS),
    icon: template.icon,
    time: daysAgoISO(0, 2026, 7, 19).slice(0, 11) + String(randomInt(rng, 0, 23)).padStart(2, "0") + ":00:00Z",
  };
}).sort((a, b) => (a.time < b.time ? 1 : -1));

export interface TodayClassSlot {
  id: string;
  subject: string;
  subjectColor: string;
  time: string;
  room: string;
  teacherOrClass: string;
}

export const TODAYS_CLASSES: TodayClassSlot[] = [
  { id: "tc1", subject: "Mathematics", subjectColor: "sky", time: "08:00 - 08:45", room: "Room 204", teacherOrClass: "Grade 8-A" },
  { id: "tc2", subject: "English Language", subjectColor: "violet", time: "08:45 - 09:30", room: "Room 204", teacherOrClass: "Grade 8-A" },
  { id: "tc3", subject: "Physics", subjectColor: "amber", time: "09:45 - 10:30", room: "Lab 1", teacherOrClass: "Grade 8-A" },
  { id: "tc4", subject: "Computer Science", subjectColor: "cyan", time: "10:30 - 11:15", room: "Lab 3", teacherOrClass: "Grade 8-A" },
  { id: "tc5", subject: "Physical Education", subjectColor: "red", time: "11:30 - 12:15", room: "Main Field", teacherOrClass: "Grade 8-A" },
];

export interface UpcomingExam {
  id: string;
  subject: string;
  date: string;
  classLabel: string;
}

export const UPCOMING_EXAMS: UpcomingExam[] = [
  { id: "ue1", subject: "Mathematics", date: daysFromNowDateOnly(4, 2026, 7, 19), classLabel: "Mid-Term" },
  { id: "ue2", subject: "Physics", date: daysFromNowDateOnly(6, 2026, 7, 19), classLabel: "Mid-Term" },
  { id: "ue3", subject: "Chemistry", date: daysFromNowDateOnly(8, 2026, 7, 19), classLabel: "Mid-Term" },
  { id: "ue4", subject: "English Language", date: daysFromNowDateOnly(10, 2026, 7, 19), classLabel: "Mid-Term" },
];

export interface PendingAssignmentItem {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
}

export const PENDING_ASSIGNMENTS: PendingAssignmentItem[] = [
  { id: "pa1", title: "Algebra Problem Set 4", subject: "Mathematics", dueDate: daysFromNowDateOnly(2, 2026, 7, 19) },
  { id: "pa2", title: "Lab Report: Titration", subject: "Chemistry", dueDate: daysFromNowDateOnly(3, 2026, 7, 19) },
  { id: "pa3", title: "Essay: Climate Change", subject: "English Language", dueDate: daysFromNowDateOnly(5, 2026, 7, 19) },
];

export function weeklyAttendanceTrend(): { day: string; percentage: number }[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return days.map((day) => ({ day, percentage: randomInt(rng, 82, 98) }));
}

export function classPerformanceBreakdown(): { subject: string; average: number; color: string }[] {
  return SUBJECTS.slice(0, 6).map((s) => ({
    subject: s.name,
    average: randomInt(rng, 62, 94),
    color: s.color,
  }));
}