import { SearchInput } from "@/components/shared/search-input";

interface TemplateSelectSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const TemplateSelectSearchInput = ({
  value,
  onChange,
}: TemplateSelectSearchInputProps) => {
  return (
    <SearchInput
      placeholder="Search templates..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8"
      onKeyDown={(e) => e.stopPropagation()}
    />
  );
};

