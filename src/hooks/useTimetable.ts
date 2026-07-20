"use client";

import { useCallback, useEffect, useState } from "react";
import type { TimetableSlot, Weekday } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";
import { generateId, sleep } from "@/lib/utils";

const STORAGE_KEY = "timetable";

export const WEEKDAYS: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const PERIODS: { period: number; startTime: string; endTime: string }[] = [
  { period: 1, startTime: "08:00", endTime: "08:45" },
  { period: 2, startTime: "08:45", endTime: "09:30" },
  { period: 3, startTime: "09:45", endTime: "10:30" },
  { period: 4, startTime: "10:30", endTime: "11:15" },
  { period: 5, startTime: "11:30", endTime: "12:15" },
  { period: 6, startTime: "12:15", endTime: "13:00" },
  { period: 7, startTime: "14:00", endTime: "14:45" },
];

// =============================================================================
// useTimetable
// Slots are keyed by (sectionId, day, period). The hook seeds a small set of
// plausible default slots per section on first load (so the grid isn't
// empty out of the box), then supports full CRUD on individual cells plus a
// teacher-conflict check (same teacher, same day+period, different section).
// =============================================================================

export interface SlotFormInput {
  subjectId: string;
  teacherId: string;
  room: string;
}

function buildSeedSlots(sectionId: string, subjectIds: string[], teacherPool: string[]): TimetableSlot[] {
  if (subjectIds.length === 0) return [];
  const slots: TimetableSlot[] = [];
  let subjIdx = 0;
  WEEKDAYS.slice(0, 5).forEach((day) => {
    PERIODS.slice(0, 6).forEach((p) => {
      const subjectId = subjectIds[subjIdx % subjectIds.length];
      const teacherId = teacherPool[subjIdx % teacherPool.length] ?? teacherPool[0] ?? "";
      subjIdx += 1;
      slots.push({
        id: generateId("slot"),
        sectionId,
        day,
        period: p.period,
        startTime: p.startTime,
        endTime: p.endTime,
        subjectId,
        teacherId,
        room: "TBD",
      });
    });
  });
  return slots;
}

export function useTimetable() {
  const [slots, setSlots] = useState<TimetableSlot[]>(() => loadFromStorage<TimetableSlot[]>(STORAGE_KEY, []));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSlots(loadFromStorage<TimetableSlot[]>(STORAGE_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY, slots);
  }, [slots, hydrated]);

  /** Ensures a section has a populated grid; generates plausible defaults once if none exist yet. */
  const ensureSeeded = useCallback((sectionId: string, subjectIds: string[], teacherIds: string[]) => {
    setSlots((prev) => {
      if (prev.some((s) => s.sectionId === sectionId)) return prev;
      const seeded = buildSeedSlots(sectionId, subjectIds, teacherIds);
      return [...prev, ...seeded];
    });
  }, []);

  const getSlot = useCallback(
    (sectionId: string, day: Weekday, period: number): TimetableSlot | undefined =>
      slots.find((s) => s.sectionId === sectionId && s.day === day && s.period === period),
    [slots]
  );

  const getSectionGrid = useCallback((sectionId: string): TimetableSlot[] => slots.filter((s) => s.sectionId === sectionId), [slots]);

  /** True if the given teacher is already booked elsewhere at this day+period (excluding the slot being edited). */
  const hasTeacherConflict = useCallback(
    (teacherId: string, day: Weekday, period: number, excludeSlotId?: string): TimetableSlot | undefined => {
      if (!teacherId) return undefined;
      return slots.find((s) => s.teacherId === teacherId && s.day === day && s.period === period && s.id !== excludeSlotId);
    },
    [slots]
  );

  const upsertSlot = useCallback(async (sectionId: string, day: Weekday, period: number, input: SlotFormInput): Promise<void> => {
    setIsSaving(true);
    await sleep(350);
    const periodDef = PERIODS.find((p) => p.period === period)!;
    setSlots((prev) => {
      const existing = prev.find((s) => s.sectionId === sectionId && s.day === day && s.period === period);
      if (existing) {
        return prev.map((s) => (s.id === existing.id ? { ...s, ...input } : s));
      }
      const newSlot: TimetableSlot = {
        id: generateId("slot"),
        sectionId,
        day,
        period,
        startTime: periodDef.startTime,
        endTime: periodDef.endTime,
        ...input,
      };
      return [...prev, newSlot];
    });
    setIsSaving(false);
  }, []);

  const clearSlot = useCallback(async (sectionId: string, day: Weekday, period: number): Promise<void> => {
    setIsSaving(true);
    await sleep(300);
    setSlots((prev) => prev.filter((s) => !(s.sectionId === sectionId && s.day === day && s.period === period)));
    setIsSaving(false);
  }, []);

  return { slots, isSaving, ensureSeeded, getSlot, getSectionGrid, hasTeacherConflict, upsertSlot, clearSlot };
}