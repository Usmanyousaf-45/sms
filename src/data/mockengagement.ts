import type { AppNotification, Notice, SchoolEvent } from "@/types";
import { makeRng, pick, randomInt, daysAgoISO, daysAgoDateOnly, daysFromNowDateOnly } from "./seedHelpers";

// =============================================================================
// MOCK DATA — Notifications, Notice Board, Events
// Consumed primarily by the Dashboard (Phase 3) and later the dedicated
// Notices/Events/Notifications modules.
// =============================================================================

const rng = makeRng(101);

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------

const NOTIFICATION_TEMPLATES: { title: string; message: string; type: AppNotification["type"]; category: string }[] = [
  { title: "Fee payment received", message: "Payment of PKR 45,000 confirmed for invoice INV-2214.", type: "success", category: "fees" },
  { title: "Assignment overdue", message: "3 students have not submitted the Physics assignment.", type: "warning", category: "assignments" },
  { title: "New admission application", message: "A new applicant has submitted documents for Grade 6.", type: "info", category: "admissions" },
  { title: "Attendance below threshold", message: "Grade 9-B attendance dropped below 80% this week.", type: "warning", category: "attendance" },
  { title: "Exam results published", message: "Mid-term results for Grade 8 are now available.", type: "success", category: "exams" },
  { title: "Library book overdue", message: "5 books are overdue by more than 7 days.", type: "error", category: "library" },
  { title: "New message received", message: "You have a new message from a parent.", type: "info", category: "messaging" },
  { title: "Timetable updated", message: "Grade 7 timetable has been revised for next week.", type: "info", category: "timetable" },
  { title: "Payroll processed", message: "July payroll has been successfully processed.", type: "success", category: "payroll" },
  { title: "Low inventory alert", message: "Lab equipment stock is running low in Chemistry lab.", type: "warning", category: "inventory" },
  { title: "Transport route delay", message: "Route 3 is running 15 minutes behind schedule.", type: "warning", category: "transport" },
  { title: "New quiz assigned", message: "A new Mathematics quiz has been assigned to your class.", type: "info", category: "lms" },
];

export const NOTIFICATIONS: AppNotification[] = NOTIFICATION_TEMPLATES.map((t, i) => ({
  id: `notif_${i + 1}`,
  title: t.title,
  message: t.message,
  type: t.type,
  category: t.category,
  createdAt: daysAgoISO(randomInt(rng, 0, 6), 2026, 7, 19),
  read: i > 4,
})).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

// -----------------------------------------------------------------------------
// Notice Board
// -----------------------------------------------------------------------------

const NOTICE_TEMPLATES: { title: string; content: string; postedBy: string; pinned: boolean }[] = [
  {
    title: "Annual Sports Day — August 14",
    content: "All students must report to the main field by 8:00 AM in house colors. Parents are welcome to attend.",
    postedBy: "Dr. Imran Malik",
    pinned: true,
  },
  {
    title: "Mid-Term Examination Schedule Released",
    content: "The mid-term examination timetable has been published. Please check your class-specific schedule under Exams.",
    postedBy: "Academic Office",
    pinned: true,
  },
  {
    title: "Parent-Teacher Meeting — July 25",
    content: "PTMs for Grades 1 through 10 will be held in respective classrooms from 2:00 PM to 5:00 PM.",
    postedBy: "Sarah Ahmed",
    pinned: false,
  },
  {
    title: "Library Renewal Week",
    content: "Students are encouraged to return or renew borrowed books before the new term begins.",
    postedBy: "Library Department",
    pinned: false,
  },
  {
    title: "Uniform Policy Reminder",
    content: "Please ensure students wear the correct winter uniform starting next Monday.",
    postedBy: "Admin Office",
    pinned: false,
  },
  {
    title: "Science Fair Registrations Open",
    content: "Students interested in participating in the Inter-School Science Fair should register with their subject teacher by Friday.",
    postedBy: "Science Department",
    pinned: false,
  },
];

export const NOTICES: Notice[] = NOTICE_TEMPLATES.map((n, i) => ({
  id: `notice_${i + 1}`,
  title: n.title,
  content: n.content,
  postedBy: n.postedBy,
  postedAt: daysAgoISO(randomInt(rng, 0, 10), 2026, 7, 19),
  pinned: n.pinned,
  audience: "all" as const,
})).sort((a, b) => (a.pinned === b.pinned ? (a.postedAt < b.postedAt ? 1 : -1) : a.pinned ? -1 : 1));

// -----------------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------------

const EVENT_TEMPLATES: { title: string; category: SchoolEvent["category"]; location: string; description: string }[] = [
  { title: "Annual Sports Day", category: "sports", location: "Main Field", description: "Inter-house athletics competition." },
  { title: "Science Fair", category: "competition", location: "Auditorium", description: "Student-led science project exhibition." },
  { title: "Mid-Term Examinations", category: "academic", location: "All Classrooms", description: "Term 1 mid-term assessments begin." },
  { title: "Cultural Day", category: "cultural", location: "School Grounds", description: "Celebration of regional cultures with performances." },
  { title: "Independence Day Holiday", category: "holiday", location: "—", description: "School closed for national holiday." },
  { title: "Inter-School Debate Competition", category: "competition", location: "Auditorium", description: "Hosting 6 schools for the regional debate finals." },
];

export const SCHOOL_EVENTS: SchoolEvent[] = EVENT_TEMPLATES.map((e, i) => ({
  id: `event_${i + 1}`,
  title: e.title,
  category: e.category,
  date: i % 2 === 0 ? daysFromNowDateOnly(randomInt(rng, 1, 30), 2026, 7, 19) : daysAgoDateOnly(randomInt(rng, 1, 20), 2026, 7, 19),
  location: e.location,
  description: e.description,
  participants: randomInt(rng, 40, 480),
}));

export function unreadNotificationCount(): number {
  return NOTIFICATIONS.filter((n) => !n.read).length;
}

void pick; // retained for future template expansion without unused-import churn