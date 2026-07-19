import type { ModuleKey } from "@/types";
import { STUDENTS, TEACHERS, PARENTS, NOTICES } from "@/data";
import { matchesSearch } from "@/lib/utils";
import type { IconName } from "@/components/ui/Icon";

// =============================================================================
// GLOBAL SEARCH
// Flattens the major entity collections into a single searchable index.
// Used by the Topbar's global search. New modules should register their
// searchable entities here as they're built (library books, courses, fees...).
// =============================================================================

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  module: ModuleKey;
  icon: IconName;
}

export function globalSearch(query: string, limit = 8): SearchResult[] {
  if (!query.trim()) return [];
  const results: SearchResult[] = [];

  for (const s of STUDENTS) {
    if (results.length >= limit) break;
    const fullName = `${s.firstName} ${s.lastName}`;
    if (matchesSearch(fullName, query) || matchesSearch(s.studentCode, query)) {
      results.push({
        id: s.id,
        title: fullName,
        subtitle: `Student · ${s.studentCode}`,
        module: "students",
        icon: "users",
      });
    }
  }

  for (const t of TEACHERS) {
    if (results.length >= limit) break;
    const fullName = `${t.firstName} ${t.lastName}`;
    if (matchesSearch(fullName, query) || matchesSearch(t.teacherCode, query)) {
      results.push({
        id: t.id,
        title: fullName,
        subtitle: `Teacher · ${t.teacherCode}`,
        module: "teachers",
        icon: "briefcase",
      });
    }
  }

  for (const p of PARENTS) {
    if (results.length >= limit) break;
    const fullName = `${p.firstName} ${p.lastName}`;
    if (matchesSearch(fullName, query)) {
      results.push({
        id: p.id,
        title: fullName,
        subtitle: `Parent · ${p.childStudentIds.length} ${p.childStudentIds.length === 1 ? "child" : "children"}`,
        module: "parents",
        icon: "userGroup",
      });
    }
  }

  for (const n of NOTICES) {
    if (results.length >= limit) break;
    if (matchesSearch(n.title, query)) {
      results.push({
        id: n.id,
        title: n.title,
        subtitle: `Notice · ${n.postedBy}`,
        module: "notices",
        icon: "megaphone",
      });
    }
  }

  return results.slice(0, limit);
}