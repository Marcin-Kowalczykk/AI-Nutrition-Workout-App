import { SearchInput } from "@/components/shared/search-input";

interface TemplateSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const TemplateSearchInput = ({
  value,
  onChange,
}: TemplateSearchInputProps) => {
  return (
    <SearchInput
      placeholder="Search templates..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full mr-2"
      containerClassName="flex-1"
    />
  );
};
