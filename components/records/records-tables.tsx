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
  value: React.ReactNode;
  date?: string | null;
}

export const MaxRecordTable = ({ title, value, date }: MaxRecordTableProps) => (
  <div className="space-y-1">
    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {title}
    </div>
    <Table className="[&_td]:px-3 [&_td]:py-2 text-sm rounded-md border bg-muted/40">
      <TableBody>
        <TableRow className="whitespace-nowrap">
          <TableCell className="whitespace-nowrap text-left">{value}</TableCell>
          <TableCell className="text-right text-muted-foreground whitespace-nowrap align-bottom">
            {date ?? "-"}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
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
