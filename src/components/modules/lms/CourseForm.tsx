"use client";

import { useState } from "react";
import type { Course, CourseLevel } from "@/types";
import type { CourseFormInput } from "@/hooks/useCourses";
import { SUBJECTS, TEACHERS, CLASSES } from "@/data";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// =============================================================================
// COURSE FORM
// Shared by "Add Course" and "Edit Course". Lessons are managed separately
// inside the course detail view (same nested-collection pattern as Sections).
// =============================================================================

interface CourseFormProps {
  initialValue?: Course;
  onSubmit: (input: CourseFormInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export function CourseForm({ initialValue, onSubmit, onCancel, submitting }: CourseFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [subjectId, setSubjectId] = useState(initialValue?.subjectId ?? SUBJECTS[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(initialValue?.teacherId ?? "");
  const [classId, setClassId] = useState(initialValue?.classId ?? CLASSES[0]?.id ?? "");
  const [level, setLevel] = useState<CourseLevel>(initialValue?.level ?? "beginner");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Course title is required.";
    if (!description.trim()) next.description = "Add a short description.";
    if (!teacherId) next.teacherId = "Select the instructor.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ title: title.trim(), description: description.trim(), subjectId, teacherId, classId, level });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Course title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/[0.07] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all resize-none"
          placeholder="What will students learn in this course?"
        />
        {errors.description && <p className="mt-1.5 text-xs text-rose-400">{errors.description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Subject" value={subjectId} onChange={setSubjectId} options={SUBJECTS.map((s) => ({ value: s.id, label: s.name }))} />
        <Select label="Class" value={classId} onChange={setClassId} options={CLASSES.map((c) => ({ value: c.id, label: c.name }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Instructor"
          value={teacherId}
          onChange={setTeacherId}
          placeholder="Select teacher"
          options={TEACHERS.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))}
          error={errors.teacherId}
        />
        <Select label="Level" value={level} onChange={(v) => setLevel(v as CourseLevel)} options={LEVELS} />
      </div>
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {initialValue ? "Save changes" : "Create course"}
        </Button>
      </div>
    </form>
  );
}