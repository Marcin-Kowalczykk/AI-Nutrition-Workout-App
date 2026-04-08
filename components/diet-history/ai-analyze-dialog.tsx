"use client";

//components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

//shared
import { AiMealAnalyzer } from "@/components/shared/diet/ai-meal-analyzer";

//types
import type { ProductAnalysis } from "@/components/shared/diet/ai-meal-analyzer";

export type { ProductAnalysis };

interface AiAnalyzeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onApply: (products: ProductAnalysis[]) => void;
}

export const AiAnalyzeDialog = ({
  open,
  onOpenChange,
  productName,
  onApply,
}: AiAnalyzeDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Analyse meal</DialogTitle>
      </DialogHeader>
      {open && (
        <AiMealAnalyzer
          productName={productName}
          onApply={onApply}
          onClose={() => onOpenChange(false)}
        />
      )}
    </DialogContent>
  </Dialog>
);
