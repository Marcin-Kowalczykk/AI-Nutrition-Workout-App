"use client";

import { useState } from "react";
import { Info } from "lucide-react";

//components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InfoButtonProps {
  title: string;
  description: string;
  ariaLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export const InfoButton = ({
  title,
  description,
  ariaLabel = "Info",
  className,
  children,
}: InfoButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-muted-foreground hover:text-foreground"}
        aria-label={ariaLabel}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </>
  );
};
