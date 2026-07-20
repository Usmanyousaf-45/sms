"use client";

import { useState } from "react";
import type { Lesson } from "@/types";
import type { LessonFormInput } from "@/hooks/useCourses";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// =============================================================================
// LESSON FORM
// Adds a single lesson to a course's sequence. Lessons are append-only in
// this UI (no reordering yet) — order is assigned by the hook based on
// current lesson count.
// =============================================================================

interface LessonFormProps {
  onSubmit: (input: LessonFormInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const TYPES: { value: Lesson["type"]; label: string }[] = [
  { value: "video", label: "Video" },
  { value: "reading", label: "Reading" },
  { value: "quiz", label: "Quiz" },
  { value: "assignment", label: "Assignment" },
];

export function LessonForm({ onSubmit, onCancel, submitting }: LessonFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Lesson["type"]>("video");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Lesson title is required.");
      return;
    }
    setError("");
    await onSubmit({ title: title.trim(), type, durationMinutes: Number(durationMinutes) || 10 });
    setTitle("");
    setDurationMinutes("15");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Lesson title" value={title} onChange={(e) => setTitle(e.target.value)} error={error} placeholder="e.g. Introduction to Fractions" />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Type" value={type} onChange={(v) => setType(v as Lesson["type"])} options={TYPES} />
        <Input label="Duration (minutes)" type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
      </div>
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Add lesson
        </Button>
      </div>
    </form>
  );
}