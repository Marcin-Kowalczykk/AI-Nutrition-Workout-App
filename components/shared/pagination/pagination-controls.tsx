"use client";

import { Field } from "@/components/ui/field";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  totalItems?: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onChangePage: (page: number) => void;
  onChangePageSize: (pageSize: number) => void;
};

export const PaginationControls = ({
  page,
  pageSize,
  pageSizeOptions = [8, 15, 20, 30, 50],
  totalItems,
  canGoPrevious,
  canGoNext,
  onChangePage,
  onChangePageSize,
}: PaginationControlsProps) => {
  const totalPages =
    typeof totalItems === "number" && totalItems > 0
      ? Math.max(1, Math.ceil(totalItems / pageSize))
      : 1;

  const buildPageItems = () => {
    const items: React.ReactNode[] = [];
    const safePage = Math.min(Math.max(1, page), totalPages);

    const pushPage = (p: number) => {
      items.push(
        <PaginationItem key={p}>
          <PaginationLink
            href="#"
            isActive={p === safePage}
            className="h-8 w-8 p-0 text-xs"
            onClick={(e) => {
              e.preventDefault();
              if (p === safePage) return;
              onChangePage(p);
            }}
          >
            {p}
          </PaginationLink>
        </PaginationItem>
      );
    };

    const pushEllipsis = (key: string) => {
      items.push(
        <PaginationItem key={key}>
          <PaginationEllipsis />
        </PaginationItem>
      );
    };

    if (totalPages <= 5) {
      for (let p = 1; p <= totalPages; p++) pushPage(p);
      return items;
    }

    pushPage(1);

    if (safePage <= 2) {
      pushPage(2);
      pushPage(3);
      pushEllipsis("right");
      pushPage(totalPages);
      return items;
    }

    if (safePage >= totalPages - 1) {
      pushEllipsis("left");
      for (let p = totalPages - 2; p <= totalPages; p++) pushPage(p);
      return items;
    }

    pushEllipsis("left");
    pushPage(safePage - 1);
    pushPage(safePage);
    pushPage(safePage + 1);
    pushEllipsis("right");
    pushPage(totalPages);

    return items;
  };

  const handlePrevious = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!canGoPrevious) return;
    const safePage = Math.min(Math.max(1, page), totalPages);
    onChangePage(Math.max(1, safePage - 1));
  };

  const handleNext = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!canGoNext) return;
    const safePage = Math.min(Math.max(1, page), totalPages);
    onChangePage(Math.min(totalPages, safePage + 1));
  };

  return (
    <div className="flex w-full items-center justify-end gap-2">
      <div className="flex items-center justify-between gap-2 rounded-md border border-muted-foreground/40 bg-background/60 px-2 py-1 w-full">
        <Field orientation="horizontal" className="w-fit ml-[-4px]">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onChangePageSize(Number(value))}
          >
            <SelectTrigger className="w-20" id="select-rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={!canGoPrevious}
                className={
                  !canGoPrevious ? "pointer-events-none opacity-80" : ""
                }
                onClick={handlePrevious}
              />
            </PaginationItem>
            {buildPageItems()}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={!canGoNext}
                className={!canGoNext ? "pointer-events-none opacity-70" : ""}
                onClick={handleNext}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
