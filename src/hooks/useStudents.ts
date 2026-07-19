"use client";

import { useCallback, useEffect, useState } from "react";
import type { Student, StudentStatus, Gender } from "@/types";
import { STUDENTS as INITIAL_STUDENTS, ALL_SECTIONS } from "@/data";
import { generateId, getAvatarGradient, getInitials, sleep } from "@/lib/utils";
import { loadFromStorage, saveToStorage } from "../lib/persistence";

const STORAGE_KEY = "students";

// =============================================================================
// useStudents
// Owns the client-side Student collection and every CRUD mutation. Shaped so
// each method's body is the only thing that changes when a real backend
// arrives (e.g. `createStudent` becomes a POST to /api/students or a Server
// Action) — callers (the Students module) never need to change.
// =============================================================================

export interface StudentFormInput {
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  classId: string;
  sectionId: string;
  rollNumber: string;
  guardianName: string;
  guardianRelation: string;
  phone: string;
  email: string;
  addressLine1: string;
  city: string;
  status: StudentStatus;
  bloodGroup?: string;
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>(() => loadFromStorage<Student[]>(STORAGE_KEY, INITIAL_STUDENTS));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // On mount, re-sync from storage (covers the SSR->client hydration gap,
  // since loadFromStorage returns the fallback during server render).
  useEffect(() => {
    setStudents(loadFromStorage<Student[]>(STORAGE_KEY, INITIAL_STUDENTS));
    setHydrated(true);
  }, []);

  // Persist every change. Skipped until after the hydration sync above so we
  // never overwrite saved data with the server-rendered fallback.
  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY, students);
  }, [students, hydrated]);

  const createStudent = useCallback(async (input: StudentFormInput): Promise<Student> => {
    setIsSaving(true);
    await sleep(500);
    const id = generateId("stu");
    const section = ALL_SECTIONS.find((s) => s.id === input.sectionId);
    const now = new Date().toISOString();
    const seq = Math.floor(1000 + Math.random() * 9000);

    const newStudent: Student = {
      id,
      studentCode: `STU-2026-${seq}`,
      firstName: input.firstName,
      lastName: input.lastName,
      gender: input.gender,
      dob: input.dob,
      classId: input.classId,
      sectionId: input.sectionId,
      rollNumber: input.rollNumber,
      guardianName: input.guardianName,
      guardianRelation: input.guardianRelation,
      phone: input.phone,
      email: input.email,
      address: {
        line1: input.addressLine1,
        city: input.city,
        state: "",
        postalCode: "",
        country: "Pakistan",
      },
      attendancePercentage: 100,
      gpa: 0,
      status: input.status,
      admissionDate: now.slice(0, 10),
      bloodGroup: input.bloodGroup,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      avatarColor: getAvatarGradient(id),
      avatarInitials: getInitials(input.firstName, input.lastName),
    };

    setStudents((prev) => [newStudent, ...prev]);
    if (section) section.studentCount += 1;
    setIsSaving(false);
    return newStudent;
  }, []);

  const updateStudent = useCallback(async (id: string, input: StudentFormInput): Promise<void> => {
    setIsSaving(true);
    await sleep(450);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              firstName: input.firstName,
              lastName: input.lastName,
              gender: input.gender,
              dob: input.dob,
              classId: input.classId,
              sectionId: input.sectionId,
              rollNumber: input.rollNumber,
              guardianName: input.guardianName,
              guardianRelation: input.guardianRelation,
              phone: input.phone,
              email: input.email,
              address: { ...s.address, line1: input.addressLine1, city: input.city },
              status: input.status,
              bloodGroup: input.bloodGroup,
              updatedAt: new Date().toISOString(),
              avatarInitials: getInitials(input.firstName, input.lastName),
            }
          : s
      )
    );
    setIsSaving(false);
  }, []);

  const deleteStudent = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setIsSaving(false);
  }, []);

  const bulkDeleteStudents = useCallback(async (ids: string[]): Promise<void> => {
    setIsSaving(true);
    await sleep(500);
    const idSet = new Set(ids);
    setStudents((prev) => prev.filter((s) => !idSet.has(s.id)));
    setIsSaving(false);
  }, []);

  return { students, isSaving, createStudent, updateStudent, deleteStudent, bulkDeleteStudents };
}