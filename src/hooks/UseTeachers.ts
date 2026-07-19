"use client";

import { useCallback, useEffect, useState } from "react";
import type { Teacher, TeacherStatus, EmploymentType, Gender } from "@/types";
import { TEACHERS as INITIAL_TEACHERS } from "@/data";
import { generateId, getAvatarGradient, getInitials, sleep } from "@/lib/utils";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";

const STORAGE_KEY = "teachers";

// =============================================================================
// useTeachers
// Owns the client-side Teacher collection and every CRUD mutation. Same shape
// as useStudents — swap the function bodies for real API calls later, callers
// stay untouched.
// =============================================================================

export interface TeacherFormInput {
  firstName: string;
  lastName: string;
  gender: Gender;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  subjectIds: string[];
  qualification: string;
  experienceYears: number;
  salary: number;
  employmentType: EmploymentType;
  status: TeacherStatus;
}

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadFromStorage<Teacher[]>(STORAGE_KEY, INITIAL_TEACHERS));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTeachers(loadFromStorage<Teacher[]>(STORAGE_KEY, INITIAL_TEACHERS));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY, teachers);
  }, [teachers, hydrated]);

  const createTeacher = useCallback(async (input: TeacherFormInput): Promise<Teacher> => {
    setIsSaving(true);
    await sleep(500);
    const id = generateId("tch");
    const now = new Date().toISOString();
    const seq = Math.floor(1000 + Math.random() * 9000);

    const newTeacher: Teacher = {
      id,
      teacherCode: `TCH-${seq}`,
      firstName: input.firstName,
      lastName: input.lastName,
      gender: input.gender,
      email: input.email,
      phone: input.phone,
      address: { line1: input.addressLine1, city: input.city, state: "", postalCode: "", country: "Pakistan" },
      subjectIds: input.subjectIds,
      assignedClassIds: [],
      qualification: input.qualification,
      experienceYears: input.experienceYears,
      salary: input.salary,
      employmentType: input.employmentType,
      joinDate: now.slice(0, 10),
      attendancePercentage: 100,
      performanceRating: 4.0,
      status: input.status,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      avatarColor: getAvatarGradient(id),
      avatarInitials: getInitials(input.firstName, input.lastName),
    };

    setTeachers((prev) => [newTeacher, ...prev]);
    setIsSaving(false);
    return newTeacher;
  }, []);

  const updateTeacher = useCallback(async (id: string, input: TeacherFormInput): Promise<void> => {
    setIsSaving(true);
    await sleep(450);
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              firstName: input.firstName,
              lastName: input.lastName,
              gender: input.gender,
              email: input.email,
              phone: input.phone,
              address: { ...t.address, line1: input.addressLine1, city: input.city },
              subjectIds: input.subjectIds,
              qualification: input.qualification,
              experienceYears: input.experienceYears,
              salary: input.salary,
              employmentType: input.employmentType,
              status: input.status,
              updatedAt: new Date().toISOString(),
              avatarInitials: getInitials(input.firstName, input.lastName),
            }
          : t
      )
    );
    setIsSaving(false);
  }, []);

  const deleteTeacher = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    setIsSaving(false);
  }, []);

  return { teachers, isSaving, createTeacher, updateTeacher, deleteTeacher };
}
