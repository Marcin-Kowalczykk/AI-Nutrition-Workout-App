"use client";

import { useState } from "react";
import { Mic, X } from "lucide-react";

//libs
import { cn } from "@/lib/utils";

//components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceInputDialog } from "@/components/diet-history/voice-input-dialog";
import { AiMealAnalyzer } from "@/components/shared/diet/ai-meal-analyzer";
import { SaveMealDialog } from "./save-meal-dialog";

//types
import type { ProductAnalysis } from "@/components/shared/diet/ai-meal-analyzer";

export const KcalCalculator = () => {
  const [mealName, setMealName] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [saveMealOpen, setSaveMealOpen] = useState(false);
  const [analyzedProducts, setAnalyzedProducts] = useState<ProductAnalysis[] | null>(null);
  const [analyzerKey, setAnalyzerKey] = useState(0);

  const canAnalyze = mealName.trim().length >= 3;

  const handleApply = (products: ProductAnalysis[]) => {
    setAnalyzedProducts(products);
  };

  const handleClear = () => {
    setMealName("");
    setShowAnalyzer(false);
    setAnalyzedProducts(null);
    setAnalyzerKey((k) => k + 1);
  };

  const handleSaveSuccess = () => {
    handleClear();
  };

  return (
    <div className="w-full xl:w-1/2 flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Kcal calculator</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">

          {/* Meal name textarea */}
          <div className="relative">
            <textarea
              value={mealName}
              onChange={(e) => {
                setMealName(e.target.value);
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              rows={1}
              placeholder="Describe your meal…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 pr-8 text-base md:text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            {mealName && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Controls row: mic + AI button */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setVoiceOpen(true)}
              className="h-8 w-8 border border-input hover:border-primary-element hover:text-primary-element"
              aria-label="Voice input"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <div
              className={cn(
                "rounded-md p-[1.5px]",
                !canAnalyze
                  ? "bg-muted"
                  : "bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400"
              )}
            >
              <Button
                type="button"
                size="sm"
                disabled={!canAnalyze}
                onClick={() => setShowAnalyzer(true)}
                className="h-8 px-2 text-xs font-bold bg-background hover:bg-muted/80 rounded-[4px] border-0"
              >
                AI
              </Button>
            </div>
          </div>

          {/* Inline AI analyzer — shown after AI button clicked */}
          {showAnalyzer && (
            <AiMealAnalyzer
              key={analyzerKey}
              productName={mealName}
              onApply={handleApply}
            />
          )}

          {/* Add new meal — shown after Apply */}
          {analyzedProducts && analyzedProducts.length > 0 && (
            <Button
              onClick={() => setSaveMealOpen(true)}
              className="w-full"
            >
              Add new meal
            </Button>
          )}
        </CardContent>
      </Card>

      <VoiceInputDialog
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        onApply={(text) => setMealName(text)}
      />

      <SaveMealDialog
        open={saveMealOpen}
        onOpenChange={setSaveMealOpen}
        products={analyzedProducts ?? []}
        onSuccess={handleSaveSuccess}
      />
    </div>
  );
};
