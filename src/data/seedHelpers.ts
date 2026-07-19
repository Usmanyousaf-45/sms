import { getAvatarGradient, getInitials } from "@/lib/utils";

// =============================================================================
// SEED HELPERS
// Small deterministic pseudo-random generators so mock data looks realistic
// and is stable across renders (no hydration mismatches from Math.random()
// at module-eval time being re-run differently on client vs server).
// =============================================================================

/** Mulberry32 seeded PRNG — deterministic across server/client renders. */
export function makeRng(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FIRST_NAMES_MALE = [
  "Ahmed", "Ali", "Hassan", "Hamza", "Bilal", "Usman", "Omar", "Zain", "Faisal", "Tariq",
  "Imran", "Kamran", "Salman", "Adeel", "Waqas", "Danish", "Farhan", "Junaid", "Nabeel", "Rizwan",
  "Arslan", "Shahid", "Yasir", "Asad", "Fahad",
];
export const FIRST_NAMES_FEMALE = [
  "Ayesha", "Fatima", "Sana", "Mahnoor", "Zainab", "Hira", "Amna", "Iqra", "Rabia", "Sara",
  "Mariam", "Areeba", "Komal", "Nimra", "Laiba", "Bushra", "Sadia", "Warda", "Anum", "Noor",
  "Sidra", "Kiran", "Maha", "Farah", "Aliza",
];
export const LAST_NAMES = [
  "Khan", "Ahmed", "Malik", "Hussain", "Sheikh", "Raza", "Iqbal", "Chaudhry", "Butt", "Qureshi",
  "Abbasi", "Farooq", "Javed", "Siddiqui", "Baig", "Mirza", "Awan", "Gill", "Cheema", "Bhatti",
];

const SUBJECT_DEFS = [
  { name: "Mathematics", code: "MATH", color: "sky" },
  { name: "English Language", code: "ENG", color: "violet" },
  { name: "Physics", code: "PHY", color: "amber" },
  { name: "Chemistry", code: "CHEM", color: "emerald" },
  { name: "Biology", code: "BIO", color: "rose" },
  { name: "Computer Science", code: "CS", color: "cyan" },
  { name: "History", code: "HIST", color: "orange" },
  { name: "Geography", code: "GEO", color: "lime" },
  { name: "Urdu", code: "URD", color: "fuchsia" },
  { name: "Islamiyat", code: "ISL", color: "teal" },
  { name: "Physical Education", code: "PE", color: "red" },
  { name: "Art & Design", code: "ART", color: "pink" },
];

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickMany<T>(rng: () => number, arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randomFloat(rng: () => number, min: number, max: number, decimals = 1): number {
  const val = rng() * (max - min) + min;
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

export function generateFullName(rng: () => number): { firstName: string; lastName: string; gender: "male" | "female" } {
  const gender: "male" | "female" = rng() > 0.5 ? "male" : "female";
  const firstName = gender === "male" ? pick(rng, FIRST_NAMES_MALE) : pick(rng, FIRST_NAMES_FEMALE);
  const lastName = pick(rng, LAST_NAMES);
  return { firstName, lastName, gender };
}

export function withAvatar<T extends { firstName: string; lastName: string; id: string }>(
  entity: T
): T & { avatarColor: string; avatarInitials: string } {
  return {
    ...entity,
    avatarColor: getAvatarGradient(entity.id),
    avatarInitials: getInitials(entity.firstName, entity.lastName),
  };
}

export function isoDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function isoDateTime(year: number, month: number, day: number, hour = 9, minute = 0): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const min = String(minute).padStart(2, "0");
  return `${year}-${mm}-${dd}T${hh}:${min}:00Z`;
}

export function daysAgoISO(days: number, fromYear = 2026, fromMonth = 7, fromDay = 19): string {
  const base = new Date(Date.UTC(fromYear, fromMonth - 1, fromDay));
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString();
}

export function daysAgoDateOnly(days: number, fromYear = 2026, fromMonth = 7, fromDay = 19): string {
  return daysAgoISO(days, fromYear, fromMonth, fromDay).slice(0, 10);
}

export function daysFromNowDateOnly(days: number, fromYear = 2026, fromMonth = 7, fromDay = 19): string {
  return daysAgoDateOnly(-days, fromYear, fromMonth, fromDay);
}

export const SUBJECT_DEFINITIONS = SUBJECT_DEFS;

export const PAKISTAN_ADDRESSES = [
  { city: "Lahore", state: "Punjab" },
  { city: "Karachi", state: "Sindh" },
  { city: "Islamabad", state: "Islamabad Capital Territory" },
  { city: "Rawalpindi", state: "Punjab" },
  { city: "Faisalabad", state: "Punjab" },
  { city: "Multan", state: "Punjab" },
];

export function generateAddress(rng: () => number) {
  const loc = pick(rng, PAKISTAN_ADDRESSES);
  return {
    line1: `House ${randomInt(rng, 1, 999)}, Street ${randomInt(rng, 1, 40)}`,
    city: loc.city,
    state: loc.state,
    postalCode: String(randomInt(rng, 10000, 99999)),
    country: "Pakistan",
  };
}