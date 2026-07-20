"use client";

import { useState } from "react";
import type { Course, Lesson } from "@/types";
import { getSubjectById, getTeacherById, getClassById } from "@/data";
import { useCourses } from "@/hooks/useCourses";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/store/ToastContext";
import { matchesSearch, cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { CourseForm } from "./CourseForm";
import { LessonForm } from "./LessonForm";
import type { CourseFormInput, LessonFormInput } from "@/hooks/useCourses";

// =============================================================================
// LMS MODULE
// Course catalog (grid) -> course detail (lesson list). Staff (admin/
// principal/teacher) get full CRUD on courses and lessons; students see a
// read-only "Continue Learning" view where they can check off lessons as
// they complete them, driving their own progress bar.
// =============================================================================

const LEVEL_BADGE: Record<Course["level"], "success" | "warning" | "error"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "error",
};

const THUMBNAIL_HEX: Record<string, string> = {
  indigo: "#6366f1", sky: "#0ea5e9", emerald: "#10b981", amber: "#f59e0b",
  rose: "#f43f5e", violet: "#8b5cf6", cyan: "#06b6d4", teal: "#14b8a6",
};

const LESSON_TYPE_ICON: Record<Lesson["type"], IconName> = {
  video: "video",
  reading: "bookOpen",
  quiz: "helpCircle",
  assignment: "clipboard",
};

type CourseModalState = { type: "add" } | { type: "edit"; course: Course } | { type: "delete"; course: Course } | null;

export function LMSModule() {
  const { session } = useAuth();
  const { courses, isSaving, createCourse, updateCourse, deleteCourse, addLesson, deleteLesson, toggleLessonComplete, isLessonComplete, getCourseProgress } =
    useCourses();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseModal, setCourseModal] = useState<CourseModalState>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<Lesson | null>(null);

  if (!session) return null;
  const isStaff = session.user.role === "admin" || session.user.role === "principal" || session.user.role === "teacher";
  const studentId = session.user.linkedEntityId ?? session.user.id;

  const filtered = courses.filter((c) => matchesSearch(c.title, search) || matchesSearch(c.description, search));
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;

  async function handleCreateCourse(input: CourseFormInput) {
    await createCourse(input);
    setCourseModal(null);
    toast.success("Course created", `${input.title} is now live in the catalog.`);
  }

  async function handleUpdateCourse(id: string, input: CourseFormInput) {
    await updateCourse(id, input);
    setCourseModal(null);
    toast.success("Course updated", `${input.title} was saved.`);
  }

  async function handleDeleteCourse(course: Course) {
    await deleteCourse(course.id);
    setCourseModal(null);
    if (selectedCourseId === course.id) setSelectedCourseId(null);
    toast.success("Course removed", `${course.title} has been deleted.`);
  }

  async function handleAddLesson(input: LessonFormInput) {
    if (!selectedCourse) return;
    await addLesson(selectedCourse.id, input);
    setLessonModalOpen(false);
    toast.success("Lesson added", `"${input.title}" was added to the course.`);
  }

  async function handleDeleteLesson() {
    if (!selectedCourse || !deleteLessonTarget) return;
    await deleteLesson(selectedCourse.id, deleteLessonTarget.id);
    setDeleteLessonTarget(null);
    toast.success("Lesson removed", `"${deleteLessonTarget.title}" was deleted.`);
  }

  // -----------------------------------------------------------------------
  // Detail view
  // -----------------------------------------------------------------------
  if (selectedCourse) {
    const subject = getSubjectById(selectedCourse.subjectId);
    const teacher = getTeacherById(selectedCourse.teacherId);
    const cls = getClassById(selectedCourse.classId);
    const progress = getCourseProgress(selectedCourse, studentId);
    const totalMinutes = selectedCourse.lessons.reduce((sum, l) => sum + l.durationMinutes, 0);

    return (
      <div className="space-y-5 animate-fade-in">
        <button onClick={() => setSelectedCourseId(null)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
          <Icon name="arrowLeft" size={13} />
          Back to courses
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${THUMBNAIL_HEX[selectedCourse.thumbnailColor] ?? "#6366f1"}22`, border: `1px solid ${THUMBNAIL_HEX[selectedCourse.thumbnailColor] ?? "#6366f1"}40` }}
            >
              <Icon name="graduationCap" size={24} style={{ color: THUMBNAIL_HEX[selectedCourse.thumbnailColor] ?? "#6366f1" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-white tracking-tight">{selectedCourse.title}</h2>
                <Badge variant={LEVEL_BADGE[selectedCourse.level]}>{capitalize(selectedCourse.level)}</Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">{selectedCourse.description}</p>
              <p className="text-xs text-slate-500 mt-2">
                {subject?.name} · {cls?.name} · {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unassigned"} · {selectedCourse.lessons.length} lessons · {totalMinutes} min total
              </p>
            </div>
          </div>
          {isStaff && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="secondary" icon="edit" onClick={() => setCourseModal({ type: "edit", course: selectedCourse })}>
                Edit
              </Button>
              <Button variant="danger" icon="trash" onClick={() => setCourseModal({ type: "delete", course: selectedCourse })}>
                Delete
              </Button>
            </div>
          )}
        </div>

        {!isStaff && (
          <Card>
            <ProgressBar progress={progress} />
          </Card>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Lessons</h3>
          {isStaff && (
            <Button size="sm" icon="plus" onClick={() => setLessonModalOpen(true)}>
              Add Lesson
            </Button>
          )}
        </div>

        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-white/[0.05]">
            {selectedCourse.lessons.map((lesson) => {
              const done = isLessonComplete(studentId, lesson.id);
              return (
                <div key={lesson.id} className="flex items-center gap-3 px-5 py-3.5">
                  {!isStaff && (
                    <button
                      onClick={() => toggleLessonComplete(studentId, lesson.id)}
                      className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
                        done ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-white/40"
                      )}
                    >
                      {done && <Icon name="check" size={13} className="text-white" strokeWidth={3} />}
                    </button>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0 text-slate-400">
                    <Icon name={LESSON_TYPE_ICON[lesson.type]} size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium truncate", done ? "text-slate-500 line-through" : "text-white")}>{lesson.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{lesson.type} · {lesson.durationMinutes} min</p>
                  </div>
                  {isStaff && (
                    <button
                      onClick={() => setDeleteLessonTarget(lesson)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
                      aria-label="Delete lesson"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              );
            })}
            {selectedCourse.lessons.length === 0 && (
              <div className="px-5 py-16 text-center">
                <Icon name="bookOpen" size={28} className="text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No lessons yet.</p>
              </div>
            )}
          </div>
        </Card>

        <Modal open={lessonModalOpen} onClose={() => setLessonModalOpen(false)} title="Add Lesson" description={`New lesson in ${selectedCourse.title}`} size="md">
          <LessonForm onSubmit={handleAddLesson} onCancel={() => setLessonModalOpen(false)} submitting={isSaving} />
        </Modal>

        <ConfirmDialog
          open={deleteLessonTarget !== null}
          onClose={() => setDeleteLessonTarget(null)}
          onConfirm={handleDeleteLesson}
          title="Delete lesson?"
          description={deleteLessonTarget ? `This will permanently remove "${deleteLessonTarget.title}" from the course.` : ""}
          confirmLabel="Delete lesson"
          loading={isSaving}
        />

        <Modal open={courseModal?.type === "edit"} onClose={() => setCourseModal(null)} title="Edit Course" size="lg">
          {courseModal?.type === "edit" && (
            <CourseForm
              initialValue={courseModal.course}
              onSubmit={(input) => handleUpdateCourse(courseModal.course.id, input)}
              onCancel={() => setCourseModal(null)}
              submitting={isSaving}
            />
          )}
        </Modal>

        <ConfirmDialog
          open={courseModal?.type === "delete"}
          onClose={() => setCourseModal(null)}
          onConfirm={() => courseModal?.type === "delete" && handleDeleteCourse(courseModal.course)}
          title="Delete course?"
          description={courseModal?.type === "delete" ? `This will permanently delete "${courseModal.course.title}" and all its lessons.` : ""}
          confirmLabel="Delete course"
          loading={isSaving}
        />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Catalog grid
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Courses</h2>
          <p className="text-sm text-slate-400 mt-0.5">{courses.length} courses in the catalog</p>
        </div>
        {isStaff && (
          <Button icon="plus" onClick={() => setCourseModal({ type: "add" })}>
            Create Course
          </Button>
        )}
      </div>

      <div className="relative">
        <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/[0.07] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((course) => {
          const subject = getSubjectById(course.subjectId);
          const teacher = getTeacherById(course.teacherId);
          const progress = getCourseProgress(course, studentId);
          const hex = THUMBNAIL_HEX[course.thumbnailColor] ?? "#6366f1";
          return (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className="text-left rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:bg-white/[0.05] hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${hex}22`, border: `1px solid ${hex}40` }}>
                  <Icon name="graduationCap" size={18} style={{ color: hex }} />
                </div>
                <Badge variant={LEVEL_BADGE[course.level]}>{capitalize(course.level)}</Badge>
              </div>
              <h3 className="text-base font-semibold text-white leading-snug">{course.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
              <p className="text-[11px] text-slate-600 mt-3">
                {subject?.name} · {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unassigned"}
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{course.lessons.length} lessons</span>
                {!isStaff && <span className="text-[11px] text-indigo-300 font-medium">{progress}% complete</span>}
              </div>
              {!isStaff && (
                <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
                </div>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Icon name="graduationCap" size={28} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No courses match your search.</p>
          </div>
        )}
      </div>

      <Modal open={courseModal?.type === "add"} onClose={() => setCourseModal(null)} title="Create Course" description="Add a new course to the catalog." size="lg">
        <CourseForm onSubmit={handleCreateCourse} onCancel={() => setCourseModal(null)} submitting={isSaving} />
      </Modal>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">Your progress</span>
        <span className="text-sm text-indigo-300 font-semibold">{progress}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}