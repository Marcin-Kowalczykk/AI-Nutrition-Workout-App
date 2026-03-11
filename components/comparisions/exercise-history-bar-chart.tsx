"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  type TooltipProps,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { HistoryPoint } from "./comparisions-page";

interface ExerciseHistoryBarChartProps {
  data: HistoryPoint[];
  yLabel: string;
  variant?: "default" | "fullscreen";
}

const chartConfig: ChartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-6)",
  },
};

type RechartsTooltipProps = TooltipProps<number, string>;

type MetricKey = "reps" | "duration" | "weight";

interface ExerciseHistoryTooltipProps extends RechartsTooltipProps {
  metric: MetricKey;
}

const ExerciseHistoryTooltip = ({
  active,
  payload,
  label,
  metric,
}: ExerciseHistoryTooltipProps) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as HistoryPoint;
  const sets = point.sets ?? [];

  let maxIndex = -1;
  sets.forEach((s, idx) => {
    const v =
      metric === "reps"
        ? s.reps
        : metric === "duration"
        ? s.duration
        : s.weight;
    if (v === point.value && maxIndex === -1) {
      maxIndex = idx;
    }
  });

  return (
    <div className="grid min-w-48 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{label}</div>

      {sets.length > 0 && (
        <div className="mt-1 grid gap-1">
          {sets.map((set: HistoryPoint["sets"][number], idx: number) => {
            const key = `${set.weight}-${set.reps}-${set.duration}`;
            const isMax = idx === maxIndex;

            return (
              <div
                key={`${key}-${idx}`}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isMax ? "bg-(--chart-2)" : "bg-(--chart-1)"
                    )}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Set {idx + 1}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[11px]",
                    isMax ? "text-(--chart-2)" : "text-(--chart-1)"
                  )}
                >
                  {set.reps > 0 && `${set.reps} reps`}
                  {set.duration > 0 &&
                    `${set.reps > 0 ? " · " : ""}${set.duration}s`}
                  {set.weight > 0 &&
                    `${set.reps > 0 || set.duration > 0 ? " · " : ""}${
                      set.weight
                    }kg`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ExerciseHistoryBarChart = ({
  data,
  yLabel,
  variant = "default",
}: ExerciseHistoryBarChartProps) => {
  if (!data.length) return null;

  const MAX_VISIBLE_BARS = 15;
  const barCount = data.length;
  const needsScroll = barCount > MAX_VISIBLE_BARS;
  const widthFactor = needsScroll ? barCount / MAX_VISIBLE_BARS : 1;
  const maxValue = Math.max(...data.map((p) => p.value));
  const isFullscreen = variant === "fullscreen";

  return (
    <div className="w-full">
      <div className={cn("flex justify-end", isFullscreen ? "mb-2" : "mb-1")}>
        <p className="text-xs text-muted-foreground">{yLabel}</p>
      </div>
      <div className="w-full overflow-x-auto">
        <div
          className={cn(
            "w-full",
            isFullscreen ? "min-h-[260px]" : "min-h-[220px]"
          )}
          style={{ width: `${widthFactor * 100}%` }}
        >
          <ChartContainer
            config={chartConfig}
            className={cn(
              "w-full",
              isFullscreen ? "h-[70vh] max-h-[420px]" : "h-[220px]"
            )}
          >
            <BarChart data={data} accessibilityLayer>
              <CartesianGrid
                strokeDasharray="3 3"
                strokeWidth={2}
                stroke="var(--border)"
              />
              <YAxis
                domain={[0, maxValue]}
                tickLine={false}
                axisLine={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                width={32}
                tickMargin={2}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                axisLine={false}
                tick={false}
              />
              <ReferenceLine
                y={maxValue}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <ChartTooltip
                content={
                  <ExerciseHistoryTooltip
                    metric={
                      yLabel.startsWith("Reps")
                        ? "reps"
                        : yLabel.startsWith("Duration")
                        ? "duration"
                        : "weight"
                    }
                  />
                }
              />
              <Bar dataKey="value" fill="var(--color-value)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
      {data.length > 0 && (
        <div
          className={cn(
            "flex justify-between text-[11px] text-muted-foreground",
            isFullscreen ? "mt-1" : "-mt-5"
          )}
        >
          <span>{data[0].dateLabel}</span>
          <span>{data[data.length - 1].dateLabel}</span>
        </div>
      )}
    </div>
  );
};
