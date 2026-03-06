"use client";
import * as React from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

// components
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Label } from "../ui/label";

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  className?: string;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  showClear?: boolean;
  fromYear?: number;
  toYear?: number;
}

// eslint-disable-next-line
export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      className,
      placeholder = "wybierz datę",
      label,
      disabled,
      showClear = true,
      fromYear,
      toYear,
    },
    ref
  ) => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const [popoverWidth, setPopoverWidth] = React.useState<number | undefined>(
      undefined
    );

    React.useEffect(() => {
      if (triggerRef.current && isPopoverOpen) {
        setPopoverWidth(triggerRef.current.offsetWidth);
      }
    }, [isPopoverOpen]);

    const handleOnSelect = (date: Date) => {
      onChange(date);
      setIsPopoverOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(undefined);
    };

    const combinedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        triggerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <div className="flex flex-col gap-2">
          {label && (
            <Label
              dangerouslySetInnerHTML={{ __html: label }}
              className="text-sm font-medium"
            />
          )}
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              ref={combinedRef}
              className={cn(
                "w-full justify-start text-left font-normal px-2 relative text-sm",
                !value && "text-muted-foreground",
                value && !isPopoverOpen && showClear && "pr-8",
                className
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {value ? (
                  format(value, "PPP", { locale: pl })
                ) : (
                  <span>{placeholder}</span>
                )}
              </span>
              {value && !isPopoverOpen && showClear && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(undefined);
                    }
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded-sm transition-colors shrink-0 cursor-pointer"
                  aria-label="Clear date"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent
          className="p-0 bg-background w-[calc(100vw-2rem)] sm:w-auto max-h-[min(85vh,28rem)] overflow-y-auto"
          align="start"
          style={{
            width: popoverWidth ? `${popoverWidth}px` : undefined,
          }}
        >
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={(date) => handleOnSelect(date as Date)}
            disabled={disabled ? disabled : undefined}
            fromYear={fromYear}
            toYear={toYear}
            locale={pl}
          />
        </PopoverContent>
      </Popover>
    );
  }
);
