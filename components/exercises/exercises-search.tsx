import { SearchInput } from "@/components/shared/search-input";

interface ExercisesSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ExercisesSearchInput = ({
  value,
  onChange,
}: ExercisesSearchInputProps) => {
  return (
    <SearchInput
      placeholder="Search categories and exercises..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-sm"
    />
  );
};

