"use client";

import { useState } from "react";
import { Mic, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";


//components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceInputDialog } from "@/components/shared/diet/voice-input-dialog";
import { AiMealAnalyzer } from "@/components/shared/diet/ai-meal-analyzer";
import { SaveMealDialog } from "./save-meal-dialog";
import { InfoButton } from "@/components/shared/info-button";

//types
import type { ProductAnalysis } from "@/components/shared/diet/ai-meal-analyzer";

export const AiMealAnalyzerPage = () => {
  const [mealName, setMealName] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [saveMealOpen, setSaveMealOpen] = useState(false);
  const [analyzedProducts, setAnalyzedProducts] = useState<ProductAnalysis[] | null>(null);
  const [analyzerKey, setAnalyzerKey] = useState(0);
  const router = useRouter();

  const canAnalyze = mealName.trim().length >= 3;

  const handleApply = (products: ProductAnalysis[]) => {
    setAnalyzedProducts(products);
    setSaveMealOpen(true);
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
    <div className="w-full xl:w-1/2 flex flex-col gap-2">
        <span className="text-center bg-primary-element/10 text-primary-element border border-primary-element/30 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider">
          Powered by Claude AI
        </span>

      <Card>
        <CardContent className="flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Describe your meal
              </span>
              <InfoButton
                title="Describe your meal"
                description="Be as specific as possible — include ingredients, weights, and cooking method. You can describe multiple dishes at once."
                ariaLabel="Describe your meal info"
              />
            </div>
            <div className="relative">
              <textarea
                value={mealName}
                onChange={(e) => {
                  setMealName(e.target.value);
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
                rows={3}
                className="flex w-full rounded-md border border-primary-element bg-background px-3 py-2 pr-8 text-base md:text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-element/60 resize-none transition-colors"
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
          </div>

          <div className="grid grid-cols-[44px_1fr] gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVoiceOpen(true)}
              className="h-11 w-11 border-input hover:border-primary-element hover:text-primary-element p-0"
              aria-label="Voice input"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="gradient"
              disabled={!canAnalyze}
              onClick={() => setShowAnalyzer(true)}
              className="h-11"
            >
              <Sparkles className="h-4 w-4" />
              Analyze with AI
            </Button>
          </div>
          <Button
              type="button"
              variant="showHide"
              onClick={() => router.push("/diet-history")}
              aria-label="go to diet history"
            >
              Go to diet history
            </Button>

          {showAnalyzer && (
            <AiMealAnalyzer
              key={analyzerKey}
              productName={mealName}
              onApply={handleApply}
              ctaLabel="Accept & Add to Diet Day"
              ctaLabelMulti="Accept {N} products & Add to Diet Day"
              ctaVariant="gradient"
            />
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
