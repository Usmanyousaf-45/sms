"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AttendanceRecord, AttendanceMark, Student } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";
import { generateId, sleep } from "@/lib/utils";

const STORAGE_KEY = "attendance";
const STUDENTS_STORAGE_KEY = "students";

// =============================================================================
// useAttendance
// Attendance is fundamentally different from Students/Teachers/Parents: it's
// not one row per entity, it's one row per (student, date) pair, entered in
// bulk for a whole section at once. The hook exposes a section+date-scoped
// "register" (load/save a full day's marks together) plus per-student history
// lookups for summary views.
// =============================================================================

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>(() => loadFromStorage<AttendanceRecord[]>(STORAGE_KEY, []));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecords(loadFromStorage<AttendanceRecord[]>(STORAGE_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY, records);
  }, [records, hydrated]);

  /** Returns the live student roster for a section (reads whatever Students module currently has). */
  const getRosterForSection = useCallback((sectionId: string, classId: string): Student[] => {
    const students = loadFromStorage<Student[] | null>(STUDENTS_STORAGE_KEY, null);
    const pool = students ?? [];
    return pool.filter((s) => s.sectionId === sectionId && s.classId === classId);
  }, []);

  /** Returns marks for a specific section+date as a studentId -> mark map. */
  const getRegisterForDate = useCallback(
    (sectionId: string, date: string): Record<string, AttendanceMark> => {
      const map: Record<string, AttendanceMark> = {};
      records
        .filter((r) => r.sectionId === sectionId && r.date === date)
        .forEach((r) => {
          map[r.studentId] = r.status;
        });
      return map;
    },
    [records]
  );

  /** Bulk-saves a full day's attendance for a section (upserts each student's mark). */
  const saveRegister = useCallback(
    async (params: { sectionId: string; classId: string; date: string; marks: Record<string, AttendanceMark>; markedBy: string }) => {
      setIsSaving(true);
      await sleep(500);
      const { sectionId, classId, date, marks, markedBy } = params;

      setRecords((prev) => {
        const withoutThisDay = prev.filter((r) => !(r.sectionId === sectionId && r.date === date));
        const newEntries: AttendanceRecord[] = Object.entries(marks).map(([studentId, status]) => ({
          id: generateId("att"),
          studentId,
          classId,
          sectionId,
          date,
          status,
          markedBy,
        }));
        return [...withoutThisDay, ...newEntries];
      });
      setIsSaving(false);
    },
    []
  );

  /** All records for one student, most recent first — used by summary/profile views. */
  const getStudentHistory = useCallback(
    (studentId: string): AttendanceRecord[] => {
      return records.filter((r) => r.studentId === studentId).sort((a, b) => (a.date < b.date ? 1 : -1));
    },
    [records]
  );

  /** Attendance % for a student across all recorded days (or within an optional date range). */
  const getStudentAttendancePercentage = useCallback(
    (studentId: string): number => {
      const history = records.filter((r) => r.studentId === studentId);
      if (history.length === 0) return 0;
      const presentOrLate = history.filter((r) => r.status === "present" || r.status === "late").length;
      return Math.round((presentOrLate / history.length) * 100);
    },
    [records]
  );

  return {
    records,
    isSaving,
    getRosterForSection,
    getRegisterForDate,
    saveRegister,
    getStudentHistory,
    getStudentAttendancePercentage,
  };
}

export const ATTENDANCE_MARK_CONFIG: Record<AttendanceMark, { label: string; color: string; badgeVariant: "success" | "error" | "warning" | "info" }> = {
  present: { label: "Present", color: "emerald", badgeVariant: "success" },
  absent: { label: "Absent", color: "rose", badgeVariant: "error" },
  late: { label: "Late", color: "amber", badgeVariant: "warning" },
  leave: { label: "Leave", color: "sky", badgeVariant: "info" },
};

export const useMemoized = useMemo; // re-exported for consuming components that need the same import surface