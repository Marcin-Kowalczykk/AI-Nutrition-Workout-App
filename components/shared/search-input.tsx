import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const SearchInput = ({
  className,
  containerClassName,
  ...inputProps
}: SearchInputProps) => {
  return (
    <div
      className={cn(
        "relative flex items-center",
        containerClassName,
      )}
    >
      <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        {...inputProps}
        className={cn("pl-8", className)}
      />
    </div>
  );
};

