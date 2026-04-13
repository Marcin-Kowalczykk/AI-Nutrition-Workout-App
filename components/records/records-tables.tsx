"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MaxRecordTableProps {
  title: string;
  mainValue: React.ReactNode;
  sub?: React.ReactNode;
  date?: string | null;
}

export const MaxRecordTable = ({ title, mainValue, sub, date }: MaxRecordTableProps) => (
  <div className="rounded-xl bg-primary-element/15 border border-primary-element/30 px-3 py-2.5 flex items-center justify-between gap-3">
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-medium uppercase tracking-widest text-primary-element/80">
        {title}
      </span>
      <span className="text-xl font-black leading-none text-foreground">
        {mainValue}
      </span>
      {sub && (
        <span className="text-[10px] text-muted-foreground">{sub}</span>
      )}
    </div>
    {date && (
      <span className="shrink-0 text-[10px] text-muted-foreground text-right">
        {date}
      </span>
    )}
  </div>
);

interface RecordsTableRow {
  key: React.Key;
  first: React.ReactNode;
  second: React.ReactNode;
  date: React.ReactNode;
}

interface RecordsTableSectionProps {
  title: string;
  firstHeader: string;
  secondHeader: string;
  rows: RecordsTableRow[];
}

export const RecordsTableSection = ({
  title,
  firstHeader,
  secondHeader,
  rows,
}: RecordsTableSectionProps) => (
  <div className="space-y-1">
    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {title}
    </div>
    <Table className="[&_th]:h-9 [&_th]:px-3 [&_td]:px-3 [&_td]:py-2 text-sm">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[20%] whitespace-nowrap">
            {firstHeader}
          </TableHead>
          <TableHead className="w-[40%] text-center whitespace-nowrap">
            {secondHeader}
          </TableHead>
          <TableHead className="w-[40%] text-right whitespace-nowrap">
            Date
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key} className="whitespace-nowrap">
            <TableCell className="whitespace-nowrap">{row.first}</TableCell>
            <TableCell className="text-center">{row.second}</TableCell>
            <TableCell className="text-right text-muted-foreground whitespace-nowrap">
              {row.date}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
