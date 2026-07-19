// =============================================================================
// SHARED UTILITIES
// Framework-agnostic helpers. No React here — keeps this layer trivially
// unit-testable and reusable from future Server Actions / API routes.
// =============================================================================

/** Merge class name fragments, dropping falsy values. Tailwind-safe (no dedupe logic needed for our usage). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Deterministic-ish unique id generator for mock data mutations (client-side only). */
let idCounter = 0;
export function generateId(prefix: string = "id"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Get initials from a full name, e.g. "Ayesha Khan" -> "AK". */
export function getInitials(firstName: string, lastName?: string): string {
  if (lastName === undefined) {
    const parts = firstName.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

/** Deterministic avatar gradient seed based on a string (name/id), from a curated palette. */
const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-emerald-600",
];

export function getAvatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

/** Format a number as currency (defaults to PKR since the school context is Pakistan-based; override as needed). */
export function formatCurrency(amount: number, currency: string = "PKR"): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format an ISO date string as a short human-readable date, e.g. "Jul 19, 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Format an ISO datetime string as a relative "time ago" string. */
export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - d) / 1000));

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w ago`;
  return formatDate(iso);
}

/** Format a "HH:MM" 24h time string as 12h with am/pm, e.g. "09:00" -> "9:00 AM". */
export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Round to 1 decimal place — used a lot for percentages/GPA display. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Simple debounce for search inputs. */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number
): (...args: TArgs) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

/** Case-insensitive substring match used by every search bar in the app. */
export function matchesSearch(value: string, query: string): boolean {
  if (!query.trim()) return true;
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

/** Generic multi-field search across an object's string-like values. */
export function searchRecord<T>(
  record: T,
  query: string,
  fields: (keyof T)[]
): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return fields.some((field) => {
    const val = record[field];
    if (typeof val === "string") return val.toLowerCase().includes(q);
    if (typeof val === "number") return val.toString().includes(q);
    return false;
  });
}

/** Generic sort by field, handling string/number/date uniformly. */
export function sortByField<T>(
  items: T[],
  field: keyof T,
  direction: "asc" | "desc"
): T[] {
  const sorted = [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    const as = String(av ?? "");
    const bs = String(bv ?? "");
    return as.localeCompare(bs);
  });
  return direction === "asc" ? sorted : sorted.reverse();
}

/** Paginate an already-filtered/sorted array. */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** Compute total page count. */
export function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

/** Grade letter from a percentage score — used by exams/results. */
export function gradeFromPercentage(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

/** Sleep helper to simulate network latency in mock async actions. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Validate email format — used across every form in the app. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate a phone number loosely (digits, spaces, +, -, parens). */
export function isValidPhone(phone: string): boolean {
  return /^[\d\s+()-]{7,20}$/.test(phone);
}