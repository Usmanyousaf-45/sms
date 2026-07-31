"use client";

import { useState } from "react";
import type { Book } from "@/types";
import { STUDENTS } from "@/data";
import { matchesSearch } from "@/lib/utils";
import { daysFromNowDateOnly } from "@/data/seedHelpers";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// =============================================================================
// ISSUE BOOK FORM
// =============================================================================

interface IssueBookFormProps {
  book: Book;
  onSubmit: (studentId: string, dueDate: string) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export function IssueBookForm({ book, onSubmit, onCancel, submitting }: IssueBookFormProps) {
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [dueDate, setDueDate] = useState(daysFromNowDateOnly(14, 2026, 7, 19));
  const [error, setError] = useState("");

  const filteredStudents = STUDENTS.filter(
    (s) => !studentSearch.trim() || matchesSearch(`${s.firstName} ${s.lastName}`, studentSearch) || matchesSearch(s.studentCode, studentSearch)
  ).slice(0, 30);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) {
      setError("Select a student to issue this book to.");
      return;
    }
    setError("");
    await onSubmit(studentId, dueDate);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
        <p className="text-sm font-medium text-white">{book.title}</p>
        <p className="text-xs text-slate-500">{book.author} · {book.availableCopies} of {book.totalCopies} copies available</p>
      </div>
      <Input
        label="Search student"
        icon="search"
        placeholder="Type a name or student ID..."
        value={studentSearch}
        onChange={(e) => setStudentSearch(e.target.value)}
      />
      <Select
        label="Select student"
        value={studentId}
        onChange={setStudentId}
        placeholder="Choose from results"
        options={filteredStudents.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.studentCode})` }))}
        error={error}
      />
      <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting} disabled={book.availableCopies <= 0}>
          Issue book
        </Button>
      </div>
    </form>
  );
}