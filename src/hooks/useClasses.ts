"use client";

import { useCallback, useEffect, useState } from "react";
import type { SchoolClass, ClassSection, Student } from "@/types";
import { CLASSES as INITIAL_CLASSES } from "@/data";
import { generateId, sleep } from "@/lib/utils";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";

const STORAGE_KEY = "classes";
const STUDENTS_STORAGE_KEY = "students";

// =============================================================================
// useClasses
// Owns the client-side Class/Section collection. Classes contain nested
// Sections (1-to-many), so mutations are shaped around that: section CRUD
// takes a classId, and deleting a class cascades to its sections. Student
// counts are read live from whatever the Students module has persisted
// (falling back to seed data), so this module stays accurate even after
// students are added/removed elsewhere — without needing global state.
// =============================================================================

export interface ClassFormInput {
  name: string;
  gradeLevel: number;
  subjectIds: string[];
}

export interface SectionFormInput {
  name: string;
  capacity: number;
  classTeacherId: string;
  roomNumber: string;
}

/** Reads the live (possibly locally-edited) student list to compute an accurate per-section headcount. */
export function liveStudentCountForSection(sectionId: string): number {
  const students = loadFromStorage<Student[] | null>(STUDENTS_STORAGE_KEY, null);
  if (!students) return 0;
  return students.filter((s) => s.sectionId === sectionId).length;
}

export function useClasses() {
  const [classes, setClasses] = useState<SchoolClass[]>(() => loadFromStorage<SchoolClass[]>(STORAGE_KEY, INITIAL_CLASSES));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setClasses(loadFromStorage<SchoolClass[]>(STORAGE_KEY, INITIAL_CLASSES));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY, classes);
  }, [classes, hydrated]);

  const createClass = useCallback(async (input: ClassFormInput): Promise<SchoolClass> => {
    setIsSaving(true);
    await sleep(450);
    const now = new Date().toISOString();
    const newClass: SchoolClass = {
      id: generateId("cls"),
      name: input.name,
      gradeLevel: input.gradeLevel,
      subjectIds: input.subjectIds,
      sections: [],
      createdAt: now,
      updatedAt: now,
    };
    setClasses((prev) => [...prev, newClass].sort((a, b) => a.gradeLevel - b.gradeLevel));
    setIsSaving(false);
    return newClass;
  }, []);

  const updateClass = useCallback(async (id: string, input: ClassFormInput): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setClasses((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, name: input.name, gradeLevel: input.gradeLevel, subjectIds: input.subjectIds, updatedAt: new Date().toISOString() }
          : c
      )
    );
    setIsSaving(false);
  }, []);

  const deleteClass = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setIsSaving(false);
  }, []);

  const addSection = useCallback(async (classId: string, input: SectionFormInput): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    const now = new Date().toISOString();
    const newSection: ClassSection = {
      id: generateId("sec"),
      classId,
      name: input.name,
      capacity: input.capacity,
      classTeacherId: input.classTeacherId || undefined,
      studentCount: 0,
      roomNumber: input.roomNumber || undefined,
      createdAt: now,
      updatedAt: now,
    };
    setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, sections: [...c.sections, newSection] } : c)));
    setIsSaving(false);
  }, []);

  const updateSection = useCallback(async (classId: string, sectionId: string, input: SectionFormInput): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? {
              ...c,
              sections: c.sections.map((s) =>
                s.id === sectionId
                  ? {
                      ...s,
                      name: input.name,
                      capacity: input.capacity,
                      classTeacherId: input.classTeacherId || undefined,
                      roomNumber: input.roomNumber || undefined,
                      updatedAt: new Date().toISOString(),
                    }
                  : s
              ),
            }
          : c
      )
    );
    setIsSaving(false);
  }, []);

  const deleteSection = useCallback(async (classId: string, sectionId: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, sections: c.sections.filter((s) => s.id !== sectionId) } : c))
    );
    setIsSaving(false);
  }, []);

  return { classes, isSaving, createClass, updateClass, deleteClass, addSection, updateSection, deleteSection };
}