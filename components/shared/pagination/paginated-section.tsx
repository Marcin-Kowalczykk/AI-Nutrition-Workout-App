"use client";

import React, { useEffect, useMemo } from "react";
import { usePagination } from "./hooks/use-pagination";
import { PaginationControls } from "./pagination-controls";

export enum PaginationPlacement {
  Top = "top",
  Bottom = "bottom",
  Both = "both",
  Auto = "auto",
}

type PaginatedSectionProps<T> = {
  items: T[];
  children: (paginatedItems: T[]) => React.ReactNode;
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  placement?: PaginationPlacement;
  bottomMinPageSizeForMultiplePages?: number;
  className?: string;
  controlsWrapperClassName?: string;
};

export function PaginatedSection<T>({
  items,
  children,
  initialPage = 1,
  initialPageSize = 8,
  pageSizeOptions,
  placement = PaginationPlacement.Auto,
  bottomMinPageSizeForMultiplePages = 9,
  className,
  controlsWrapperClassName,
}: PaginatedSectionProps<T>) {
  const {
    page,
    pageSize,
    pageSizeOptions: internalOptions,
    canGoPrevious,
    onChangePage,
    onChangePageSize,
    setPage,
  } = usePagination({
    initialPage,
    initialPageSize,
    pageSizeOptions,
  });

  const total = items.length;

  useEffect(() => {
    if (total === 0) {
      if (page !== 1) setPage(1);
      return;
    }

    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [total, page, pageSize, setPage]);

  const paginatedItems = useMemo(() => {
    if (!total) return [];
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }, [items, page, pageSize, total]);

  const canGoNext = page * pageSize < total;

  const hasItems = total > 0;
  const hasMultiplePages = canGoPrevious || canGoNext;

  let showTop = false;
  let showBottom = false;

  if (hasItems) {
    switch (placement) {
      case PaginationPlacement.Top: {
        showTop = true;
        break;
      }
      case PaginationPlacement.Bottom: {
        showBottom = true;
        break;
      }
      case PaginationPlacement.Both: {
        showTop = true;
        showBottom = true;
        break;
      }
      case PaginationPlacement.Auto:
      default: {
        if (!hasMultiplePages) {
          showTop = true;
        } else if (
          typeof bottomMinPageSizeForMultiplePages === "number" &&
          pageSize < bottomMinPageSizeForMultiplePages
        ) {
          showTop = true;
        } else {
          showTop = true;
          showBottom = true;
        }
        break;
      }
    }
  }

  const controls = (
    <div className={controlsWrapperClassName}>
      <PaginationControls
        page={page}
        pageSize={pageSize}
        totalItems={total}
        pageSizeOptions={pageSizeOptions ?? internalOptions}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onChangePage={onChangePage}
        onChangePageSize={onChangePageSize}
      />
    </div>
  );

  return (
    <div className={className}>
      {showTop && controls}
      {children(paginatedItems)}
      {showBottom && controls}
    </div>
  );
}
