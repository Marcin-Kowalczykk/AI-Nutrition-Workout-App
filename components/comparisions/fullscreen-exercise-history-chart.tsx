"use client";

import { ExerciseHistoryBarChart } from "@/components/comparisions/exercise-history-bar-chart";
import type { HistoryPoint } from "./comparisions-page";

interface FullscreenExerciseHistoryChartProps {
  open: boolean;
  data: HistoryPoint[];
  yLabel: string;
}

export const FullscreenExerciseHistoryChart = ({
  open,
  data,
  yLabel,
}: FullscreenExerciseHistoryChartProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col justify-end"
      style={{
        paddingLeft: "calc(env(safe-area-inset-left, 0px) + 12px)",
        paddingRight: "12px",
        paddingTop: "8px",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
      }}
    >
      <ExerciseHistoryBarChart data={data} yLabel={yLabel} />
    </div>
  );
};

