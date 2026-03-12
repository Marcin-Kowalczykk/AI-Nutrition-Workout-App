"use client";

import { useState } from "react";

type UsePaginationOptions = {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
};

export const usePagination = (options?: UsePaginationOptions) => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
  } = options ?? {};

  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const canGoPrevious = page > 1;

  const handleChangePage = (nextPage: number) => {
    if (!Number.isFinite(nextPage)) return;
    const safe = Math.max(1, Math.floor(nextPage));
    if (safe === page) return;
    setPage(safe);
  };

  const handleChangePageSize = (nextSize: number) => {
    if (!Number.isFinite(nextSize)) return;
    const safe = Math.max(1, Math.floor(nextSize));
    if (safe === pageSize) return;
    setPage(1);
    setPageSize(safe);
  };

  return {
    page,
    pageSize,
    pageSizeOptions,
    canGoPrevious,
    onChangePage: handleChangePage,
    onChangePageSize: handleChangePageSize,
    setPage,
    setPageSize,
  };
};
