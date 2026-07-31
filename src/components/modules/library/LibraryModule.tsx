"use client";

import { useState } from "react";
import type { Book, BookIssue } from "@/types";
import { getBookById, getStudentById, BOOK_CATEGORIES } from "@/data";
import { useLibrary } from "@/hooks/useLibrary";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/store/ToastContext";
import { matchesSearch, formatDate } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { Select } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { BookForm } from "./BookForm";
import { IssueBookForm } from "./IssueBookForm";
import type { BookFormInput } from "@/hooks/useLibrary";

// =============================================================================
// LIBRARY MODULE
// Two tabs: "Catalog" (browse/search/filter books, staff can add books and
// issue copies) and "Issued Books" (active loans with return + late fee).
// Students see the catalog read-only (no issue button — that's a staff
// action performed at the desk).
// =============================================================================

type Tab = "catalog" | "issued";
type ModalState = { type: "add" } | { type: "issue"; book: Book } | { type: "delete"; book: Book } | null;

const ISSUE_STATUS_BADGE: Record<BookIssue["status"], "info" | "success" | "error"> = {
  issued: "info",
  returned: "success",
  overdue: "error",
};

export function LibraryModule() {
  const { session } = useAuth();
  const { books, issues, isSaving, createBook, deleteBook, issueBook, returnBook } = useLibrary();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("catalog");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [returnTarget, setReturnTarget] = useState<BookIssue | null>(null);

  if (!session) return null;
  const isStaff = session.user.role === "admin" || session.user.role === "principal" || session.user.role === "teacher";

  const filteredBooks = books.filter(
    (b) => (!category || b.category === category) && (matchesSearch(b.title, search) || matchesSearch(b.author, search))
  );

  const activeIssues = issues.filter((i) => i.status !== "returned").sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));

  async function handleAddBook(input: BookFormInput) {
    await createBook(input);
    setModal(null);
    toast.success("Book added", `${input.title} has been added to the catalog.`);
  }

  async function handleDeleteBook(book: Book) {
    await deleteBook(book.id);
    setModal(null);
    toast.success("Book removed", `${book.title} has been removed from the catalog.`);
  }

  async function handleIssue(studentId: string, dueDate: string) {
    if (modal?.type !== "issue") return;
    await issueBook(modal.book.id, studentId, dueDate);
    setModal(null);
    const student = getStudentById(studentId);
    toast.success("Book issued", `${modal.book.title} issued to ${student ? `${student.firstName} ${student.lastName}` : "student"}.`);
  }

  async function handleReturn() {
    if (!returnTarget) return;
    await returnBook(returnTarget.id);
    setReturnTarget(null);
    toast.success("Book returned", "The return has been recorded.");
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Library</h2>
          <p className="text-sm text-slate-400 mt-0.5">{books.length} titles · {activeIssues.length} currently issued</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
            <TabButton active={tab === "catalog"} onClick={() => setTab("catalog")} label="Catalog" />
            <TabButton active={tab === "issued"} onClick={() => setTab("issued")} label="Issued Books" />
          </div>
          {isStaff && tab === "catalog" && (
            <Button icon="plus" onClick={() => setModal({ type: "add" })}>
              Add Book
            </Button>
          )}
        </div>
      </div>

      {tab === "catalog" ? (
        <>
          <Card className="!p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/[0.07] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
              <Select value={category} onChange={setCategory} placeholder="All categories" options={BOOK_CATEGORIES.map((c) => ({ value: c, label: c }))} className="lg:w-48" />
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: coverHex(book.coverColor) + "22", border: `1px solid ${coverHex(book.coverColor)}40` }}
                  >
                    <Icon name="book" size={16} style={{ color: coverHex(book.coverColor) }} />
                  </div>
                  {isStaff && (
                    <button onClick={() => setModal({ type: "delete", book })} className="text-slate-500 hover:text-rose-400 transition-colors" aria-label="Remove book">
                      <Icon name="trash" size={13} />
                    </button>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{book.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{book.author}</p>
                <Badge variant="neutral" className="mt-2 w-fit">
                  {book.category}
                </Badge>
                <div className="mt-auto pt-3">
                  <p className="text-[11px] text-slate-500 mb-2">
                    {book.availableCopies}/{book.totalCopies} available
                  </p>
                  {isStaff && (
                    <Button size="sm" variant="secondary" className="w-full" disabled={book.availableCopies <= 0} onClick={() => setModal({ type: "issue", book })}>
                      {book.availableCopies <= 0 ? "Unavailable" : "Issue"}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
            {filteredBooks.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Icon name="book" size={28} className="text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No books match your search or filters.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Book</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeIssues.map((issue) => {
                  const book = getBookById(issue.bookId);
                  const student = getStudentById(issue.studentId);
                  const isOverdue = new Date(issue.dueDate) < new Date("2026-07-19");
                  return (
                    <tr key={issue.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{book?.title ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-300">{student ? `${student.firstName} ${student.lastName}` : "—"}</td>
                      <td className="px-4 py-3 text-slate-300">{formatDate(issue.dueDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={isOverdue ? "error" : ISSUE_STATUS_BADGE[issue.status]}>{isOverdue ? "Overdue" : capitalize(issue.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isStaff && (
                          <Button size="sm" variant="secondary" onClick={() => setReturnTarget(issue)}>
                            Mark Returned
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {activeIssues.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-slate-500">
                      No books currently issued.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modal?.type === "add"} onClose={() => setModal(null)} title="Add Book" description="Add a new title to the library catalog." size="md">
        <BookForm onSubmit={handleAddBook} onCancel={() => setModal(null)} submitting={isSaving} />
      </Modal>

      <Modal open={modal?.type === "issue"} onClose={() => setModal(null)} title="Issue Book" size="md">
        {modal?.type === "issue" && <IssueBookForm book={modal.book} onSubmit={handleIssue} onCancel={() => setModal(null)} submitting={isSaving} />}
      </Modal>

      <ConfirmDialog
        open={modal?.type === "delete"}
        onClose={() => setModal(null)}
        onConfirm={() => modal?.type === "delete" && handleDeleteBook(modal.book)}
        title="Remove book?"
        description={modal?.type === "delete" ? `This will permanently remove "${modal.book.title}" from the catalog.` : ""}
        confirmLabel="Remove book"
        loading={isSaving}
      />

      <ConfirmDialog
        open={returnTarget !== null}
        onClose={() => setReturnTarget(null)}
        onConfirm={handleReturn}
        variant="primary"
        title="Mark as returned?"
        description={
          returnTarget
            ? `Confirm this book has been returned.${new Date(returnTarget.dueDate) < new Date("2026-07-19") ? " A late fee will be calculated automatically." : ""}`
            : ""
        }
        confirmLabel="Confirm return"
        loading={isSaving}
      />
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${active ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"}`}>
      {label}
    </button>
  );
}

function coverHex(color: string): string {
  const map: Record<string, string> = {
    indigo: "#6366f1", sky: "#0ea5e9", emerald: "#10b981", amber: "#f59e0b",
    rose: "#f43f5e", violet: "#8b5cf6", cyan: "#06b6d4", teal: "#14b8a6",
  };
  return map[color] ?? "#6366f1";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}