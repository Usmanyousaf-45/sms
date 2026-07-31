"use client";

import { useCallback, useEffect, useState } from "react";
import type { Book, BookIssue } from "@/types";
import { BOOKS as INITIAL_BOOKS, BOOK_ISSUES as INITIAL_ISSUES } from "@/data";
import { generateId, sleep } from "@/lib/utils";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";

const BOOKS_KEY = "library_books";
const ISSUES_KEY = "library_issues";
const LATE_FEE_PER_DAY = 20; // PKR per day overdue

// =============================================================================
// useLibrary
// Books and Issues are separate collections (same "join table" pattern as
// exam results) since one book can have many issue records over time.
// availableCopies is kept in sync on every issue/return so it never has to
// be recomputed elsewhere.
// =============================================================================

export interface BookFormInput {
  title: string;
  author: string;
  category: string;
  isbn: string;
  totalCopies: number;
}

const COVER_COLORS = ["indigo", "sky", "emerald", "amber", "rose", "violet", "cyan", "teal"];

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>(() => loadFromStorage<Book[]>(BOOKS_KEY, INITIAL_BOOKS));
  const [issues, setIssues] = useState<BookIssue[]>(() => loadFromStorage<BookIssue[]>(ISSUES_KEY, INITIAL_ISSUES));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBooks(loadFromStorage<Book[]>(BOOKS_KEY, INITIAL_BOOKS));
    setIssues(loadFromStorage<BookIssue[]>(ISSUES_KEY, INITIAL_ISSUES));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(BOOKS_KEY, books);
  }, [books, hydrated]);

  useEffect(() => {
    if (hydrated) saveToStorage(ISSUES_KEY, issues);
  }, [issues, hydrated]);

  const createBook = useCallback(
    async (input: BookFormInput): Promise<Book> => {
      setIsSaving(true);
      await sleep(400);
      const newBook: Book = {
        id: generateId("book"),
        isbn: input.isbn,
        title: input.title,
        author: input.author,
        category: input.category,
        totalCopies: input.totalCopies,
        availableCopies: input.totalCopies,
        coverColor: COVER_COLORS[books.length % COVER_COLORS.length],
      };
      setBooks((prev) => [newBook, ...prev]);
      setIsSaving(false);
      return newBook;
    },
    [books.length]
  );

  const deleteBook = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setIssues((prev) => prev.filter((i) => i.bookId !== id));
    setIsSaving(false);
  }, []);

  const issueBook = useCallback(async (bookId: string, studentId: string, dueDate: string): Promise<void> => {
    setIsSaving(true);
    await sleep(450);
    const newIssue: BookIssue = {
      id: generateId("issue"),
      bookId,
      studentId,
      issuedDate: new Date().toISOString().slice(0, 10),
      dueDate,
      status: "issued",
      lateFee: 0,
    };
    setIssues((prev) => [newIssue, ...prev]);
    setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b)));
    setIsSaving(false);
  }, []);

  const returnBook = useCallback(async (issueId: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);

    let affectedBookId: string | null = null;

    setIssues((prev) =>
      prev.map((i) => {
        if (i.id !== issueId) return i;
        affectedBookId = i.bookId;
        const returnedDate = new Date().toISOString().slice(0, 10);
        const daysLate = Math.max(0, Math.floor((new Date(returnedDate).getTime() - new Date(i.dueDate).getTime()) / 86400000));
        return { ...i, status: "returned" as const, returnedDate, lateFee: daysLate * LATE_FEE_PER_DAY };
      })
    );

    if (affectedBookId) {
      const bookId = affectedBookId;
      setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b)));
    }

    setIsSaving(false);
  }, []);

  return { books, issues, isSaving, createBook, deleteBook, issueBook, returnBook };
}