"use client";

import { useState } from "react";
import type { AssignmentFormInput } from "@/hooks/useAssignments";
import { COURSES } from "@/data";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// =============================================================================
// ASSIGNMENT FORM
// Create-only (assignments aren't edited in this UI, matching how most real
// LMS tools treat published assignments — you'd create a new one instead).
// =============================================================================

interface AssignmentFormProps {
  onSubmit: (input: AssignmentFormInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export function AssignmentForm({ onSubmit, onCancel, submitting }: AssignmentFormProps) {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState(COURSES[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required.";
    if (!description.trim()) next.description = "Add instructions for students.";
    if (!dueDate) next.dueDate = "Set a due date.";
    if (!maxScore || Number(maxScore) <= 0) next.maxScore = "Enter a valid max score.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ title: title.trim(), courseId, description: description.trim(), dueDate, maxScore: Number(maxScore) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
      <Select label="Course" value={courseId} onChange={setCourseId} options={COURSES.map((c) => ({ value: c.id, label: c.title }))} />
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Instructions</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/[0.07] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all resize-none"
          placeholder="What should students do for this assignment?"
        />
        {errors.description && <p className="mt-1.5 text-xs text-rose-400">{errors.description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} error={errors.dueDate} />
        <Input label="Max score" type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} error={errors.maxScore} />
      </div>
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Create assignment
        </Button>
      </div>
    </form>
  );
}