"use client";

import { useState } from "react";
import type { ExamFormInput } from "@/hooks/useExams";
import { CLASSES, getClassById } from "@/data";
import { SUBJECTS } from "@/data";
import { Input, Select } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui/Button";

// =============================================================================
// EXAM FORM
// Creates a new scheduled exam with a subject list; each subject gets an
// auto-incrementing date starting from the exam's start date (one subject
// per day), matching how school exam schedules are typically laid out.
// =============================================================================

interface ExamFormProps {
  onSubmit: (input: ExamFormInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export function ExamForm({ onSubmit, onCancel, submitting }: ExamFormProps) {
  const [name, setName] = useState("");
  const [classId, setClassId] = useState(CLASSES[0]?.id ?? "");
  const [term, setTerm] = useState("Term 1");
  const [startDate, setStartDate] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [maxMarks, setMaxMarks] = useState("100");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cls = getClassById(classId);
  const availableSubjects = SUBJECTS.filter((s) => cls?.subjectIds.includes(s.id));

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Exam name is required.";
    if (!startDate) next.startDate = "Set a start date.";
    if (subjectIds.length === 0) next.subjectIds = "Select at least one subject.";
    if (!maxMarks || Number(maxMarks) <= 0) next.maxMarks = "Enter a valid max marks value.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const endDate = computeEndDate(startDate, subjectIds.length);
    await onSubmit({ name: name.trim(), classId, term, startDate, endDate, subjectIds, maxMarks: Number(maxMarks) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Exam name" placeholder="e.g. Mid-Term Examination" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Class"
          value={classId}
          onChange={(v) => {
            setClassId(v);
            setSubjectIds([]);
          }}
          options={CLASSES.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select label="Term" value={term} onChange={setTerm} options={[{ value: "Term 1", label: "Term 1" }, { value: "Term 2", label: "Term 2" }]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.startDate} />
        <Input label="Max marks per subject" type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} error={errors.maxMarks} />
      </div>
      <MultiSelect
        label="Subjects (one exam day each, in order)"
        options={availableSubjects.map((s) => ({ value: s.id, label: s.name }))}
        selected={subjectIds}
        onChange={setSubjectIds}
        error={errors.subjectIds}
      />
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Schedule exam
        </Button>
      </div>
    </form>
  );
}

function computeEndDate(startDate: string, subjectCount: number): string {
  if (!startDate) return startDate;
  const d = new Date(startDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + Math.max(0, subjectCount - 1));
  return d.toISOString().slice(0, 10);
}