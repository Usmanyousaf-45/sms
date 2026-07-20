"use client";

import { useCallback, useEffect, useState } from "react";
import type { Course, Lesson, CourseLevel } from "@/types";
import { COURSES as INITIAL_COURSES } from "@/data";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";
import { generateId, sleep, round1 } from "@/lib/utils";

const STORAGE_KEY = "lms_courses";
const COMPLETION_KEY = "lms_lesson_completion"; // per-student completion, keyed "studentId:lessonId"

// =============================================================================
// useCourses
// Courses own their lesson list (nested, same pattern as Class/Section).
// Per-student lesson completion is tracked separately (a join-table style
// map) so marking one student's progress doesn't require rewriting the whole
// course record — mirrors how this would be a separate `lesson_completions`
// table in a real schema.
// =============================================================================

export interface CourseFormInput {
  title: string;
  description: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  level: CourseLevel;
}

export interface LessonFormInput {
  title: string;
  type: Lesson["type"];
  durationMinutes: number;
}

const THUMBNAIL_COLORS = ["indigo", "sky", "emerald", "amber", "rose", "violet", "cyan", "teal"];

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>(() => loadFromStorage<Course[]>(STORAGE_KEY, INITIAL_COURSES));
  const [completion, setCompletion] = useState<Record<string, boolean>>(() => loadFromStorage(COMPLETION_KEY, {}));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCourses(loadFromStorage<Course[]>(STORAGE_KEY, INITIAL_COURSES));
    setCompletion(loadFromStorage(COMPLETION_KEY, {}));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY, courses);
  }, [courses, hydrated]);

  useEffect(() => {
    if (hydrated) saveToStorage(COMPLETION_KEY, completion);
  }, [completion, hydrated]);

  const createCourse = useCallback(async (input: CourseFormInput): Promise<Course> => {
    setIsSaving(true);
    await sleep(450);
    const now = new Date().toISOString();
    const newCourse: Course = {
      id: generateId("course"),
      title: input.title,
      description: input.description,
      subjectId: input.subjectId,
      teacherId: input.teacherId,
      classId: input.classId,
      level: input.level,
      thumbnailColor: THUMBNAIL_COLORS[courses.length % THUMBNAIL_COLORS.length],
      lessons: [],
      enrolledStudentIds: [],
      progressByStudent: {},
      certificateIssued: [],
      createdAt: now,
      updatedAt: now,
    };
    setCourses((prev) => [newCourse, ...prev]);
    setIsSaving(false);
    return newCourse;
  }, [courses.length]);

  const updateCourse = useCallback(async (id: string, input: CourseFormInput): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setCourses((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, title: input.title, description: input.description, subjectId: input.subjectId, teacherId: input.teacherId, classId: input.classId, level: input.level, updatedAt: new Date().toISOString() }
          : c
      )
    );
    setIsSaving(false);
  }, []);

  const deleteCourse = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setIsSaving(false);
  }, []);

  const addLesson = useCallback(async (courseId: string, input: LessonFormInput): Promise<void> => {
    setIsSaving(true);
    await sleep(350);
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const newLesson: Lesson = {
          id: generateId("lsn"),
          courseId,
          title: input.title,
          order: c.lessons.length + 1,
          durationMinutes: input.durationMinutes,
          type: input.type,
          completed: false,
        };
        return { ...c, lessons: [...c.lessons, newLesson] };
      })
    );
    setIsSaving(false);
  }, []);

  const deleteLesson = useCallback(async (courseId: string, lessonId: string): Promise<void> => {
    setIsSaving(true);
    await sleep(300);
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) } : c))
    );
    setIsSaving(false);
  }, []);

  /** Toggles a lesson's completion state for a given student. */
  const toggleLessonComplete = useCallback((studentId: string, lessonId: string) => {
    const key = `${studentId}:${lessonId}`;
    setCompletion((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isLessonComplete = useCallback(
    (studentId: string, lessonId: string): boolean => !!completion[`${studentId}:${lessonId}`],
    [completion]
  );

  /** % of a course's lessons completed by a given student. */
  const getCourseProgress = useCallback(
    (course: Course, studentId: string): number => {
      if (course.lessons.length === 0) return 0;
      const done = course.lessons.filter((l) => completion[`${studentId}:${l.id}`]).length;
      return round1((done / course.lessons.length) * 100);
    },
    [completion]
  );

  return {
    courses,
    isSaving,
    createCourse,
    updateCourse,
    deleteCourse,
    addLesson,
    deleteLesson,
    toggleLessonComplete,
    isLessonComplete,
    getCourseProgress,
  };
}