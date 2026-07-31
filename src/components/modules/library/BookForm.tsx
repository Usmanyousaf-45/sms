"use client";

import { useState } from "react";
import type { BookFormInput } from "@/hooks/useLibrary";
import { BOOK_CATEGORIES } from "@/data";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// =============================================================================
// BOOK FORM
// Create-only (catalog entries aren't edited here — copies/availability
// change through issue/return, not manual edits).
// =============================================================================

interface BookFormProps {
  onSubmit: (input: BookFormInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export function BookForm({ onSubmit, onCancel, submitting }: BookFormProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState(BOOK_CATEGORIES[0] ?? "");
  const [isbn, setIsbn] = useState("");
  const [totalCopies, setTotalCopies] = useState("3");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required.";
    if (!author.trim()) next.author = "Author is required.";
    if (!isbn.trim()) next.isbn = "ISBN is required.";
    if (!totalCopies || Number(totalCopies) < 1) next.totalCopies = "Enter a valid copy count.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ title: title.trim(), author: author.trim(), category, isbn: isbn.trim(), totalCopies: Number(totalCopies) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Book title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Author" value={author} onChange={(e) => setAuthor(e.target.value)} error={errors.author} />
        <Select label="Category" value={category} onChange={setCategory} options={BOOK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} error={errors.isbn} />
        <Input label="Total copies" type="number" min={1} value={totalCopies} onChange={(e) => setTotalCopies(e.target.value)} error={errors.totalCopies} />
      </div>
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Add book
        </Button>
      </div>
    </form>
  );
}