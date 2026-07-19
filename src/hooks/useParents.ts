"use client";

import { useCallback, useEffect, useState } from "react";
import type { Parent } from "@/types";
import { PARENTS as INITIAL_PARENTS } from "@/data";
import { generateId, getAvatarGradient, getInitials, sleep } from "@/lib/utils";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";

const STORAGE_KEY = "parents";

// =============================================================================
// useParents
// Owns the client-side Parent collection and CRUD mutations, persisted to
// localStorage (same pattern as useStudents / useTeachers). Parents are
// linked to Students via childStudentIds, so create/update also validates
// that at least one child is selected.
// =============================================================================

export interface ParentFormInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  occupation: string;
  childStudentIds: string[];
}

export function useParents() {
  const [parents, setParents] = useState<Parent[]>(() => loadFromStorage<Parent[]>(STORAGE_KEY, INITIAL_PARENTS));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setParents(loadFromStorage<Parent[]>(STORAGE_KEY, INITIAL_PARENTS));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY, parents);
  }, [parents, hydrated]);

  const createParent = useCallback(async (input: ParentFormInput): Promise<Parent> => {
    setIsSaving(true);
    await sleep(500);
    const id = generateId("par");
    const now = new Date().toISOString();

    const newParent: Parent = {
      id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      address: { line1: input.addressLine1, city: input.city, state: "", postalCode: "", country: "Pakistan" },
      occupation: input.occupation || undefined,
      childStudentIds: input.childStudentIds,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      avatarColor: getAvatarGradient(id),
      avatarInitials: getInitials(input.firstName, input.lastName),
    };

    setParents((prev) => [newParent, ...prev]);
    setIsSaving(false);
    return newParent;
  }, []);

  const updateParent = useCallback(async (id: string, input: ParentFormInput): Promise<void> => {
    setIsSaving(true);
    await sleep(450);
    setParents((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              firstName: input.firstName,
              lastName: input.lastName,
              email: input.email,
              phone: input.phone,
              address: { ...p.address, line1: input.addressLine1, city: input.city },
              occupation: input.occupation || undefined,
              childStudentIds: input.childStudentIds,
              updatedAt: new Date().toISOString(),
              avatarInitials: getInitials(input.firstName, input.lastName),
            }
          : p
      )
    );
    setIsSaving(false);
  }, []);

  const deleteParent = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setParents((prev) => prev.filter((p) => p.id !== id));
    setIsSaving(false);
  }, []);

  return { parents, isSaving, createParent, updateParent, deleteParent };
}