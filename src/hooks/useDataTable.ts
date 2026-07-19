"use client";

import { useMemo, useState } from "react";
import { searchRecord, sortByField, paginate, totalPages as computeTotalPages } from "@/lib/utils";

// =============================================================================
// useDataTable
// Generic table state hook: search + multi-field filters + sort + pagination.
// Every CRUD module (Students, Teachers, Parents, Fees, Library...) uses this
// exact hook so table behavior is 100% consistent across the app.
// =============================================================================

interface UseDataTableOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  initialSortField?: keyof T;
  pageSize?: number;
}

export function useDataTable<T>({
  data,
  searchFields,
  initialSortField,
  pageSize = 10,
}: UseDataTableOptions<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<keyof T | undefined>(initialSortField);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({});
    setSearchQuery("");
    setPage(1);
  }

  function toggleSort(field: keyof T) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  const filtered = useMemo(() => {
    let result = data.filter((item) => searchRecord(item, searchQuery, searchFields));
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      result = result.filter((item) => String(item[key as keyof T]) === value);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, searchQuery, filters, searchFields]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return sortByField(filtered, sortField, sortDirection);
  }, [filtered, sortField, sortDirection]);

  const total = sorted.length;
  const pages = computeTotalPages(total, pageSize);
  const safePage = Math.min(page, pages);
  const pageItems = useMemo(() => paginate(sorted, safePage, pageSize), [sorted, safePage, pageSize]);

  return {
    searchQuery,
    setSearchQuery: (q: string) => {
      setSearchQuery(q);
      setPage(1);
    },
    filters,
    setFilter,
    clearFilters,
    sortField,
    sortDirection,
    toggleSort,
    page: safePage,
    setPage,
    totalPages: pages,
    total,
    items: pageItems,
  };
}