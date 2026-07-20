"use client";

import { useState } from "react";
import type { TimetableSlot, Weekday } from "@/types";
import type { SlotFormInput } from "@/hooks/useTimetable";
import { SUBJECTS, TEACHERS } from "@/data";
import { formatTime } from "@/lib/utils";
import { Select } from "@/components/ui/Input";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

// =============================================================================
// SLOT FORM
// Editor for a single timetable cell (one section, one day, one period).
// Shows a live conflict warning if the selected teacher is already booked
// elsewhere at this exact day+period.
// =============================================================================

interface SlotFormProps {
  day: Weekday;
  period: number;
  startTime: string;
  endTime: string;
  initialValue?: TimetableSlot;
  onSubmit: (input: SlotFormInput) => Promise<void>;
  onClear?: () => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  checkConflict: (teacherId: string) => TimetableSlot | undefined;
}

export function SlotForm({ day, period, startTime, endTime, initialValue, onSubmit, onClear, onCancel, submitting, checkConflict }: SlotFormProps) {
  const [subjectId, setSubjectId] = useState(initialValue?.subjectId ?? SUBJECTS[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(initialValue?.teacherId ?? "");
  const [room, setRoom] = useState(initialValue?.room ?? "");
  const [error, setError] = useState("");

  const conflict = teacherId ? checkConflict(teacherId) : undefined;
  const conflictSubject = conflict ? SUBJECTS.find((s) => s.id === conflict.subjectId) : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId) {
      setError("Select a subject.");
      return;
    }
    if (!teacherId) {
      setError("Select a teacher.");
      return;
    }
    setError("");
    await onSubmit({ subjectId, teacherId, room: room.trim() || "TBD" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5">
        <Icon name="clock" size={14} className="text-slate-500" />
        <span className="text-sm text-slate-300">
          {day} · Period {period} · {formatTime(startTime)}–{formatTime(endTime)}
        </span>
      </div>

      <Select label="Subject" value={subjectId} onChange={setSubjectId} options={SUBJECTS.map((s) => ({ value: s.id, label: s.name }))} />
      <Select label="Teacher" value={teacherId} onChange={setTeacherId} placeholder="Select teacher" options={TEACHERS.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))} />
      <Input label="Room" placeholder="e.g. Room 204, Lab 1" value={room} onChange={(e) => setRoom(e.target.value)} />

      {conflict && conflict.id !== initialValue?.id && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
          <Icon name="alertTriangle" size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            This teacher already teaches {conflictSubject?.name ?? "another subject"} elsewhere during this exact period. Saving will double-book them.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
          <Icon name="alertCircle" size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2.5 pt-1">
        {onClear && initialValue ? (
          <Button type="button" variant="ghost" icon="trash" onClick={onClear}>
            Clear slot
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2.5">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {initialValue ? "Save changes" : "Assign slot"}
          </Button>
        </div>
      </div>
    </form>
  );
}