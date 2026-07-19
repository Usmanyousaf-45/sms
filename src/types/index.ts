// =============================================================================
// CORE DOMAIN TYPES — School ERP (LMS + SMS)
// Designed to map 1:1 onto a future Prisma schema. Field names, nullability,
// and relations mirror what the eventual PostgreSQL tables will look like so
// migrating from mock data to Prisma/Better Auth later is a drop-in swap.
// =============================================================================

// -----------------------------------------------------------------------------
// Shared / Utility Types
// -----------------------------------------------------------------------------

export type ID = string;

export type ISODateString = string; // e.g. "2026-07-19"
export type ISODateTimeString = string; // e.g. "2026-07-19T09:30:00Z"

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Timestamped {
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface SoftDeletable {
  isArchived: boolean;
}

/** Generic paginated response shape — mirrors what a future API route returns. */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Generic sort direction used by table headers across the app. */
export type SortDirection = "asc" | "desc";

export interface SortState<TField extends string = string> {
  field: TField;
  direction: SortDirection;
}

/** Standard result wrapper for mock "async" operations (mirrors a future fetch/Server Action). */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// -----------------------------------------------------------------------------
// Auth & RBAC
// -----------------------------------------------------------------------------

export type Role = "admin" | "principal" | "teacher" | "student" | "parent";

export const ROLES: Role[] = ["admin", "principal", "teacher", "student", "parent"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  principal: "Principal",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

/**
 * Permission keys are deliberately granular and namespaced by module so RBAC
 * can be enforced consistently once real authorization (e.g. Better Auth +
 * a policy layer) is introduced. UI should gate on these, not on `role`
 * directly, so the permission model can evolve independently of roles.
 */
export type Permission =
  | "students:read"
  | "students:write"
  | "teachers:read"
  | "teachers:write"
  | "parents:read"
  | "parents:write"
  | "classes:read"
  | "classes:write"
  | "attendance:read"
  | "attendance:write"
  | "timetable:read"
  | "timetable:write"
  | "lms:read"
  | "lms:write"
  | "exams:read"
  | "exams:write"
  | "fees:read"
  | "fees:write"
  | "library:read"
  | "library:write"
  | "transport:read"
  | "transport:write"
  | "hostel:read"
  | "hostel:write"
  | "payroll:read"
  | "payroll:write"
  | "inventory:read"
  | "inventory:write"
  | "messaging:read"
  | "messaging:write"
  | "reports:read"
  | "settings:read"
  | "settings:write"
  | "admissions:read"
  | "admissions:write";

export interface AuthUser extends Timestamped {
  id: ID;
  name: string;
  email: string;
  role: Role;
  avatarColor: string; // deterministic gradient seed for avatar since we have no image uploads
  avatarInitials: string;
  linkedEntityId?: ID; // e.g. studentId, teacherId, parentId — links auth identity to domain record
  phone?: string;
  isActive: boolean;
  lastLoginAt?: ISODateTimeString;
}

export interface Session {
  user: AuthUser;
  permissions: Permission[];
  issuedAt: ISODateTimeString;
  expiresAt: ISODateTimeString;
}

export type AuthView = "login" | "signup" | "forgot-password" | "reset-sent";

// -----------------------------------------------------------------------------
// Academic Structure — Classes, Sections, Subjects
// -----------------------------------------------------------------------------

export interface Subject extends Timestamped {
  id: ID;
  name: string;
  code: string;
  classIds: ID[];
  color: string; // for timetable/badge rendering
}

export interface ClassSection extends Timestamped {
  id: ID;
  classId: ID;
  name: string; // e.g. "A", "B"
  capacity: number;
  classTeacherId?: ID; // teacherId
  studentCount: number;
  roomNumber?: string;
}

export interface SchoolClass extends Timestamped {
  id: ID;
  name: string; // e.g. "Grade 8"
  gradeLevel: number;
  sections: ClassSection[];
  subjectIds: ID[];
}

// -----------------------------------------------------------------------------
// Student
// -----------------------------------------------------------------------------

export type StudentStatus = "active" | "inactive" | "graduated" | "suspended" | "transferred";
export type Gender = "male" | "female" | "other";

export interface Student extends Timestamped, SoftDeletable {
  id: ID;
  studentCode: string; // human-facing student ID e.g. "STU-2026-0142"
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: ISODateString;
  classId: ID;
  sectionId: ID;
  rollNumber: string;
  guardianName: string;
  guardianRelation: string;
  parentId?: ID;
  phone: string;
  email: string;
  address: Address;
  attendancePercentage: number;
  gpa: number;
  status: StudentStatus;
  admissionDate: ISODateString;
  bloodGroup?: string;
  avatarColor: string;
  avatarInitials: string;
}

// -----------------------------------------------------------------------------
// Teacher
// -----------------------------------------------------------------------------

export type TeacherStatus = "active" | "on-leave" | "inactive";
export type EmploymentType = "full-time" | "part-time" | "contract";

export interface Teacher extends Timestamped, SoftDeletable {
  id: ID;
  teacherCode: string; // e.g. "TCH-0032"
  firstName: string;
  lastName: string;
  gender: Gender;
  email: string;
  phone: string;
  address: Address;
  subjectIds: ID[];
  assignedClassIds: ID[]; // sectionIds actually — class-sections this teacher teaches
  qualification: string;
  experienceYears: number;
  salary: number;
  employmentType: EmploymentType;
  joinDate: ISODateString;
  attendancePercentage: number;
  performanceRating: number; // 0-5
  status: TeacherStatus;
  avatarColor: string;
  avatarInitials: string;
}

// -----------------------------------------------------------------------------
// Parent / Guardian
// -----------------------------------------------------------------------------

export interface Parent extends Timestamped, SoftDeletable {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  occupation?: string;
  childStudentIds: ID[];
  avatarColor: string;
  avatarInitials: string;
}

// -----------------------------------------------------------------------------
// Admissions
// -----------------------------------------------------------------------------

export type AdmissionStatus = "pending" | "approved" | "rejected" | "waitlisted";
export type DocumentStatus = "incomplete" | "submitted" | "verified";

export interface Admission extends Timestamped {
  id: ID;
  admissionNumber: string;
  applicantFirstName: string;
  applicantLastName: string;
  dob: ISODateString;
  gender: Gender;
  appliedClassId: ID;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  documentStatus: DocumentStatus;
  feeStatus: "unpaid" | "paid";
  status: AdmissionStatus;
  submittedAt: ISODateTimeString;
  notes?: string;
}

// -----------------------------------------------------------------------------
// Attendance
// -----------------------------------------------------------------------------

export type AttendanceMark = "present" | "absent" | "late" | "leave";

export interface AttendanceRecord {
  id: ID;
  studentId: ID;
  classId: ID;
  sectionId: ID;
  date: ISODateString;
  status: AttendanceMark;
  markedBy: ID; // teacherId
  remark?: string;
}

// -----------------------------------------------------------------------------
// Timetable
// -----------------------------------------------------------------------------

export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export interface TimetableSlot {
  id: ID;
  sectionId: ID;
  day: Weekday;
  period: number;
  startTime: string; // "09:00"
  endTime: string; // "09:45"
  subjectId: ID;
  teacherId: ID;
  room: string;
}

// -----------------------------------------------------------------------------
// LMS — Courses, Lessons, Quizzes, Assignments
// -----------------------------------------------------------------------------

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Lesson {
  id: ID;
  courseId: ID;
  title: string;
  order: number;
  durationMinutes: number;
  type: "video" | "reading" | "quiz" | "assignment";
  completed: boolean;
  resourceUrl?: string; // placeholder reference
}

export interface Course extends Timestamped {
  id: ID;
  title: string;
  description: string;
  subjectId: ID;
  teacherId: ID;
  classId: ID;
  level: CourseLevel;
  thumbnailColor: string;
  lessons: Lesson[];
  enrolledStudentIds: ID[];
  progressByStudent: Record<ID, number>; // studentId -> % complete
  certificateIssued: ID[]; // studentIds who earned certificate
}

export interface QuizQuestion {
  id: ID;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Quiz {
  id: ID;
  courseId?: ID;
  title: string;
  subjectId: ID;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  attemptsAllowed: number;
}

export interface QuizAttempt {
  id: ID;
  quizId: ID;
  studentId: ID;
  score: number;
  totalQuestions: number;
  submittedAt: ISODateTimeString;
  answers: Record<ID, number>; // questionId -> chosen option index
}

// -----------------------------------------------------------------------------
// Homework & Assignments
// -----------------------------------------------------------------------------

export type SubmissionStatus = "pending" | "submitted" | "graded" | "late";

export interface Homework {
  id: ID;
  title: string;
  description: string;
  classId: ID;
  sectionId: ID;
  subjectId: ID;
  teacherId: ID;
  assignedDate: ISODateString;
  dueDate: ISODateString;
  attachmentPlaceholder?: string;
  submissions: HomeworkSubmission[];
}

export interface HomeworkSubmission {
  id: ID;
  homeworkId: ID;
  studentId: ID;
  status: SubmissionStatus;
  submittedAt?: ISODateTimeString;
  grade?: string;
  feedback?: string;
}

export interface Assignment {
  id: ID;
  title: string;
  courseId: ID;
  description: string;
  dueDate: ISODateString;
  maxScore: number;
  submissions: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: ID;
  assignmentId: ID;
  studentId: ID;
  status: SubmissionStatus;
  score?: number;
  comments?: string;
  submittedAt?: ISODateTimeString;
}

// -----------------------------------------------------------------------------
// Exams & Results
// -----------------------------------------------------------------------------

export type ExamStatus = "scheduled" | "ongoing" | "completed";

export interface Exam extends Timestamped {
  id: ID;
  name: string; // e.g. "Mid-Term Examination"
  classId: ID;
  term: string;
  startDate: ISODateString;
  endDate: ISODateString;
  status: ExamStatus;
  subjectSchedule: { subjectId: ID; date: ISODateString; maxMarks: number }[];
}

export interface ExamResult {
  id: ID;
  examId: ID;
  studentId: ID;
  subjectId: ID;
  marksObtained: number;
  maxMarks: number;
  grade: string;
}

// -----------------------------------------------------------------------------
// Fee Management
// -----------------------------------------------------------------------------

export type FeeStatus = "paid" | "pending" | "overdue" | "partial";

export interface FeeInvoice {
  id: ID;
  invoiceNumber: string;
  studentId: ID;
  title: string; // e.g. "Term 1 Tuition Fee"
  amount: number;
  discount: number;
  scholarshipAmount: number;
  amountPaid: number;
  dueDate: ISODateString;
  status: FeeStatus;
  issuedDate: ISODateString;
  paymentHistory: FeePayment[];
}

export interface FeePayment {
  id: ID;
  invoiceId: ID;
  amount: number;
  paidOn: ISODateTimeString;
  method: "cash" | "card" | "bank-transfer" | "online";
  receiptNumber: string;
}

// -----------------------------------------------------------------------------
// Library
// -----------------------------------------------------------------------------

export interface Book {
  id: ID;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  coverColor: string;
}

export type IssueStatus = "issued" | "returned" | "overdue";

export interface BookIssue {
  id: ID;
  bookId: ID;
  studentId: ID;
  issuedDate: ISODateString;
  dueDate: ISODateString;
  returnedDate?: ISODateString;
  status: IssueStatus;
  lateFee: number;
}

// -----------------------------------------------------------------------------
// Transport
// -----------------------------------------------------------------------------

export interface Vehicle {
  id: ID;
  registrationNumber: string;
  model: string;
  capacity: number;
  driverId: ID;
}

export interface Driver {
  id: ID;
  name: string;
  phone: string;
  licenseNumber: string;
}

export interface TransportRoute {
  id: ID;
  name: string;
  vehicleId: ID;
  pickupPoints: string[];
  studentIds: ID[];
  departureTime: string;
  returnTime: string;
}

// -----------------------------------------------------------------------------
// Hostel
// -----------------------------------------------------------------------------

export type RoomStatus = "available" | "full" | "maintenance";

export interface HostelRoom {
  id: ID;
  roomNumber: string;
  block: string;
  capacity: number;
  occupantStudentIds: ID[];
  status: RoomStatus;
  feePerTerm: number;
}

export interface HostelVisitor {
  id: ID;
  studentId: ID;
  visitorName: string;
  relation: string;
  date: ISODateString;
  checkIn: string;
  checkOut?: string;
}

// -----------------------------------------------------------------------------
// Payroll
// -----------------------------------------------------------------------------

export type PayrollStatus = "paid" | "pending" | "processing";

export interface PayrollRecord {
  id: ID;
  staffId: ID; // teacherId or generic staff
  staffName: string;
  role: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: string; // "2026-07"
  status: PayrollStatus;
}

// -----------------------------------------------------------------------------
// Inventory
// -----------------------------------------------------------------------------

export type InventoryStatus = "in-stock" | "low-stock" | "out-of-stock";
export type InventoryCategory = "lab-equipment" | "computers" | "furniture" | "sports" | "other";

export interface InventoryItem {
  id: ID;
  name: string;
  category: InventoryCategory;
  quantity: number;
  status: InventoryStatus;
  supplier: string;
  purchaseDate: ISODateString;
  unitCost: number;
}

// -----------------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------------

export type EventCategory = "academic" | "sports" | "competition" | "cultural" | "holiday";

export interface SchoolEvent {
  id: ID;
  title: string;
  category: EventCategory;
  date: ISODateString;
  location: string;
  description: string;
  participants: number;
}

// -----------------------------------------------------------------------------
// Notice Board
// -----------------------------------------------------------------------------

export interface Notice {
  id: ID;
  title: string;
  content: string;
  postedBy: string;
  postedAt: ISODateTimeString;
  pinned: boolean;
  audience: Role[] | "all";
}

// -----------------------------------------------------------------------------
// Messaging
// -----------------------------------------------------------------------------

export interface ChatMessage {
  id: ID;
  threadId: ID;
  senderId: ID;
  senderName: string;
  senderRole: Role;
  content: string;
  sentAt: ISODateTimeString;
  read: boolean;
}

export interface ChatThread {
  id: ID;
  participantIds: ID[];
  participantNames: string[];
  lastMessage: string;
  lastMessageAt: ISODateTimeString;
  unreadCount: number;
}

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------

export type NotificationType = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: ID;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: ISODateTimeString;
  read: boolean;
  category: string; // e.g. "fees", "attendance", "exams"
}

// -----------------------------------------------------------------------------
// Toast (transient UI feedback — distinct from persisted AppNotification)
// -----------------------------------------------------------------------------

export interface Toast {
  id: ID;
  title: string;
  description?: string;
  variant: "success" | "error" | "info" | "warning";
}

// -----------------------------------------------------------------------------
// Settings
// -----------------------------------------------------------------------------

export interface SchoolSettings {
  schoolName: string;
  tagline: string;
  address: Address;
  phone: string;
  email: string;
  academicYear: string;
  language: string;
  theme: "light" | "dark";
  primaryColor: string;
}

// -----------------------------------------------------------------------------
// Navigation
// -----------------------------------------------------------------------------

export type ModuleKey =
  | "dashboard"
  | "students"
  | "teachers"
  | "parents"
  | "admissions"
  | "classes"
  | "attendance"
  | "timetable"
  | "lms"
  | "quizzes"
  | "exams"
  | "homework"
  | "assignments"
  | "fees"
  | "library"
  | "transport"
  | "hostel"
  | "payroll"
  | "inventory"
  | "events"
  | "notices"
  | "messaging"
  | "notifications"
  | "reports"
  | "ai"
  | "settings";

export interface NavItem {
  key: ModuleKey;
  label: string;
  icon: string; // key into the Icon component's icon map
  roles: Role[]; // which roles see this in the sidebar
  badge?: number;
}