"use client";

import { SearchInput } from "@/components/shared/search-input";

interface WorkoutHistorySearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const WorkoutHistorySearchInput = ({
  value,
  onChange,
}: WorkoutHistorySearchInputProps) => {
  return (
    <SearchInput
      placeholder="Search workouts..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full"
      containerClassName="w-full"
    />
  );
};

