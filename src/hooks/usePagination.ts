"use client";

import { useState, useMemo } from "react";

interface PaginationResult<T> {
  page: number;
  totalPages: number;
  pageItems: T[];
  setPage: (p: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  totalItems: number;
  startIdx: number;
  endIdx: number;
}

export function usePagination<T>(items: T[], defaultSize = 25): PaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const safePage = useMemo(() => {
    if (page > totalPages) return totalPages;
    if (page < 1) return 1;
    return page;
  }, [page, totalPages]);

  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, items.length);

  const pageItems = useMemo(() => items.slice(startIdx, endIdx), [items, startIdx, endIdx]);

  return {
    page: safePage,
    totalPages,
    pageItems,
    setPage: (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
    pageSize,
    setPageSize: (s: number) => { setPageSize(s); setPage(1); },
    totalItems: items.length,
    startIdx: startIdx + 1,
    endIdx,
  };
}
