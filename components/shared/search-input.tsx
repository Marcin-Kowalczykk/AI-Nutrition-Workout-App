import * as React from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  showClear?: boolean;
}

export const SearchInput = ({
  className,
  containerClassName,
  showClear = true,
  ...inputProps
}: SearchInputProps) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!inputRef.current) return;

    const target = inputRef.current;
    target.value = "";

    if (inputProps.onChange) {
      const syntheticEvent = {
        ...event,
        target,
        currentTarget: target,
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      inputProps.onChange(syntheticEvent);
    }
  };

  const canShowClear =
    showClear &&
    typeof inputProps.value === "string" &&
    inputProps.value.length > 0 &&
    !inputProps.disabled;

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
        ref={inputRef}
        className={cn(
          "pl-8",
          canShowClear && "pr-8",
          className,
        )}
      />
      {canShowClear && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

