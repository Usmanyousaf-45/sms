"use client";

import { useState } from "react";
import type { ClassSection } from "@/types";
import type { SectionFormInput } from "@/hooks/UseClasses";
import { TEACHERS } from "@/data";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// =============================================================================
// SECTION FORM
// Shared by "Add Section" and "Edit Section" — always scoped to a parent
// class, which the caller already knows (classId is passed to the hook, not
// collected here).
// =============================================================================

interface SectionFormProps {
  initialValue?: ClassSection;
  onSubmit: (input: SectionFormInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export function SectionForm({ initialValue, onSubmit, onCancel, submitting }: SectionFormProps) {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [capacity, setCapacity] = useState(String(initialValue?.capacity ?? 35));
  const [classTeacherId, setClassTeacherId] = useState(initialValue?.classTeacherId ?? "");
  const [roomNumber, setRoomNumber] = useState(initialValue?.roomNumber ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Section name is required (e.g. A, B).";
    if (!capacity || Number(capacity) < 1) next.capacity = "Enter a valid capacity.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ name: name.trim(), capacity: Number(capacity), classTeacherId, roomNumber: roomNumber.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Section name" placeholder="e.g. A" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Input label="Capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} error={errors.capacity} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Class teacher"
          value={classTeacherId}
          onChange={setClassTeacherId}
          placeholder="Unassigned"
          options={TEACHERS.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))}
        />
        <Input label="Room number" placeholder="e.g. 204" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
      </div>
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {initialValue ? "Save changes" : "Add section"}
        </Button>
      </div>
    </form>
  );
}