"use client";

import { useState } from "react";
import type { SchoolClass } from "@/types";
import type { ClassFormInput } from "@/hooks/UseClasses";
import { SUBJECTS } from "@/data";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui/Button";

// =============================================================================
// CLASS FORM
// Shared by "Add Class" and "Edit Class". Sections are managed separately
// (see SectionForm) since they're a nested collection, not a form field.
// =============================================================================

interface ClassFormProps {
  initialValue?: SchoolClass;
  onSubmit: (input: ClassFormInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export function ClassForm({ initialValue, onSubmit, onCancel, submitting }: ClassFormProps) {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [gradeLevel, setGradeLevel] = useState(String(initialValue?.gradeLevel ?? 1));
  const [subjectIds, setSubjectIds] = useState<string[]>(initialValue?.subjectIds ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Class name is required.";
    if (!gradeLevel || Number(gradeLevel) < 1) next.gradeLevel = "Enter a valid grade level.";
    if (subjectIds.length === 0) next.subjectIds = "Select at least one subject.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ name: name.trim(), gradeLevel: Number(gradeLevel), subjectIds });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Class name" placeholder="e.g. Grade 8" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Input label="Grade level" type="number" min={1} value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} error={errors.gradeLevel} />
      </div>
      <MultiSelect
        label="Subjects taught in this class"
        options={SUBJECTS.map((s) => ({ value: s.id, label: s.name }))}
        selected={subjectIds}
        onChange={setSubjectIds}
        error={errors.subjectIds}
      />
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {initialValue ? "Save changes" : "Create class"}
        </Button>
      </div>
    </form>
  );
}