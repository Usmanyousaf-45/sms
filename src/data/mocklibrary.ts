import type { Book, BookIssue } from "@/types";
import { STUDENTS } from "./mockCore";
import { makeRng, pick, randomInt, isoDate, daysAgoDateOnly, daysFromNowDateOnly } from "./seedHelpers";
import { generateId } from "@/lib/utils";

// =============================================================================
// MOCK DATA — Library Books & Issues
// =============================================================================

const rng = makeRng(808);

const BOOK_DEFS: { title: string; author: string; category: string }[] = [
  { title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction" },
  { title: "1984", author: "George Orwell", category: "Fiction" },
  { title: "A Brief History of Time", author: "Stephen Hawking", category: "Science" },
  { title: "The Elements of Style", author: "Strunk & White", category: "Reference" },
  { title: "Pride and Prejudice", author: "Jane Austen", category: "Fiction" },
  { title: "Sapiens", author: "Yuval Noah Harari", category: "History" },
  { title: "The Diary of a Young Girl", author: "Anne Frank", category: "Biography" },
  { title: "Introduction to Algorithms", author: "Cormen et al.", category: "Computer Science" },
  { title: "Cosmos", author: "Carl Sagan", category: "Science" },
  { title: "The Alchemist", author: "Paulo Coelho", category: "Fiction" },
  { title: "Guns, Germs, and Steel", author: "Jared Diamond", category: "History" },
  { title: "Calculus: Early Transcendentals", author: "James Stewart", category: "Mathematics" },
  { title: "The Wright Brothers", author: "David McCullough", category: "Biography" },
  { title: "Organic Chemistry", author: "Paula Bruice", category: "Science" },
  { title: "Charlotte's Web", author: "E.B. White", category: "Fiction" },
  { title: "The Selfish Gene", author: "Richard Dawkins", category: "Science" },
  { title: "Atlas Shrugged", author: "Ayn Rand", category: "Fiction" },
  { title: "World Atlas", author: "National Geographic", category: "Reference" },
  { title: "Clean Code", author: "Robert C. Martin", category: "Computer Science" },
  { title: "The Kite Runner", author: "Khaled Hosseini", category: "Fiction" },
];

const COVER_COLORS = ["indigo", "sky", "emerald", "amber", "rose", "violet", "cyan", "teal"];

export const BOOKS: Book[] = BOOK_DEFS.map((def, i) => {
  const totalCopies = randomInt(rng, 2, 8);
  const issuedCount = randomInt(rng, 0, totalCopies);
  return {
    id: `book_${i + 1}`,
    isbn: `978-${randomInt(rng, 1000000000, 9999999999)}`,
    title: def.title,
    author: def.author,
    category: def.category,
    totalCopies,
    availableCopies: totalCopies - issuedCount,
    coverColor: COVER_COLORS[i % COVER_COLORS.length],
  };
});

export const BOOK_CATEGORIES = Array.from(new Set(BOOK_DEFS.map((b) => b.category)));

function buildIssue(bookId: string, studentId: string, index: number): BookIssue {
  const overdue = rng() > 0.85;
  const returned = rng() > 0.5 && !overdue;
  const issuedDate = daysAgoDateOnly(randomInt(rng, 3, 20), 2026, 7, 19);
  const dueDate = overdue ? daysAgoDateOnly(randomInt(rng, 1, 10), 2026, 7, 19) : daysFromNowDateOnly(randomInt(rng, 1, 14), 2026, 7, 19);

  return {
    id: generateId("issue"),
    bookId,
    studentId,
    issuedDate,
    dueDate,
    returnedDate: returned ? daysAgoDateOnly(randomInt(rng, 0, 5), 2026, 7, 19) : undefined,
    status: returned ? "returned" : overdue ? "overdue" : "issued",
    lateFee: overdue ? randomInt(rng, 50, 500) : 0,
  };
}

const activeBooks = BOOKS.filter((b) => b.availableCopies < b.totalCopies);
export const BOOK_ISSUES: BookIssue[] = activeBooks.flatMap((book, i) => {
  const issuedCount = book.totalCopies - book.availableCopies;
  return Array.from({ length: issuedCount }, (_, j) => {
    const student = pick(rng, STUDENTS);
    return buildIssue(book.id, student.id, i * 10 + j);
  });
});

export function getBookById(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}

void isoDate;