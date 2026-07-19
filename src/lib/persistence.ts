"use client";

// =============================================================================
// LOCAL PERSISTENCE
// Thin wrapper around localStorage so CRUD state survives page refresh.
// This is a stopgap for the mock-data phase — once a real backend (Prisma/
// PostgreSQL) is wired up, these calls disappear and the hooks talk to the
// API/Server Actions instead. Safe no-op on the server (SSR) since it only
// touches `window` inside functions, never at module-eval time.
// =============================================================================

const STORAGE_PREFIX = "brightfield_erp_v1_";

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (private browsing) — fail silently,
    // state still works in-memory for the session.
  }
}

export function clearStorageKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignore
  }
}
