import { describe, it, expect } from "vitest";
import { buildChartData } from "./build-chart-data";
import type { ChartConfigState } from "@/components/comparisions/chart-config-modal";
import type { IWorkoutItem } from "@/app/api/workouts/types";

// Helpers

const makeSet = (reps: number, weight: number, duration = 0, isChecked = true) => ({
  reps,
  weight,
  duration,
  isChecked,
});

const makeWorkout = (
  id: string,
  exerciseName: string,
  sets: ReturnType<typeof makeSet>[],
  created_at = "2024-01-01T10:00:00Z"
): IWorkoutItem =>
  ({
    id,
    name: "Workout",
    created_at,
    exercises: [
      {
        name: exerciseName,
        sets,
      },
    ],
  } as unknown as IWorkoutItem);

const repsOnlyConfig = (weightTarget = ""): ChartConfigState => ({
  mode: "reps_only",
  repsTarget: "",
  weightTarget,
  bodyweightOnly: false,
});

const repsWeightConfig = (repsTarget: string): ChartConfigState => ({
  mode: "reps_weight",
  repsTarget,
  weightTarget: "",
  bodyweightOnly: false,
});

// Tests

describe("buildChartData", () => {
  describe("reps_only mode — no weightTarget (bodyweight only)", () => {
    it("includes only sets with weight === 0", () => {
      const workouts = [
        makeWorkout("w1", "pull-up", [
          makeSet(10, 0),
          makeSet(8, 20),
        ]),
      ];

      const { points } = buildChartData(workouts, "pull-up", "reps-based", repsOnlyConfig(""));

      expect(points).toHaveLength(1);
      expect(points[0].value).toBe(10);
      expect(points[0].sets).toHaveLength(1);
      expect(points[0].sets[0]).toMatchObject({ reps: 10, weight: 0 });
    });

    it("returns empty when all sets have weight > 0", () => {
      const workouts = [
        makeWorkout("w1", "bench-press", [
          makeSet(5, 60),
          makeSet(5, 70),
        ]),
      ];

      const { points } = buildChartData(workouts, "bench-press", "reps-based", repsOnlyConfig(""));

      expect(points).toHaveLength(0);
    });

    it("picks the max reps across matching sets for a given workout", () => {
      const workouts = [
        makeWorkout("w1", "pull-up", [
          makeSet(8, 0),
          makeSet(12, 0),
          makeSet(10, 0),
        ]),
      ];

      const { points } = buildChartData(workouts, "pull-up", "reps-based", repsOnlyConfig(""));

      expect(points[0].value).toBe(12);
    });
  });

  describe("reps_only mode — with weightTarget", () => {
    it("includes only sets matching the exact weight", () => {
      const workouts = [
        makeWorkout("w1", "bench-press", [
          makeSet(8, 0),
          makeSet(6, 50),
          makeSet(5, 60),
        ]),
      ];

      const { points } = buildChartData(workouts, "bench-press", "reps-based", repsOnlyConfig("50"));

      expect(points).toHaveLength(1);
      expect(points[0].value).toBe(6);
      expect(points[0].sets).toHaveLength(1);
      expect(points[0].sets[0]).toMatchObject({ reps: 6, weight: 50 });
    });

    it("returns empty when no sets match the given weight", () => {
      const workouts = [
        makeWorkout("w1", "bench-press", [
          makeSet(8, 0),
          makeSet(5, 60),
        ]),
      ];

      const { points } = buildChartData(workouts, "bench-press", "reps-based", repsOnlyConfig("50"));

      expect(points).toHaveLength(0);
    });

    it("picks the max reps across sets at the given weight", () => {
      const workouts = [
        makeWorkout("w1", "bench-press", [
          makeSet(6, 50),
          makeSet(9, 50),
          makeSet(7, 50),
        ]),
      ];

      const { points } = buildChartData(workouts, "bench-press", "reps-based", repsOnlyConfig("50"));

      expect(points[0].value).toBe(9);
    });

    it("returns all matching sets in the tooltip data", () => {
      const workouts = [
        makeWorkout("w1", "bench-press", [
          makeSet(6, 50),
          makeSet(9, 50),
        ]),
      ];

      const { points } = buildChartData(workouts, "bench-press", "reps-based", repsOnlyConfig("50"));

      expect(points[0].sets).toHaveLength(2);
    });
  });

  describe("reps_only mode — yLabel", () => {
    it("returns 'Reps' as yLabel", () => {
      const workouts = [makeWorkout("w1", "pull-up", [makeSet(10, 0)])];

      const { yLabel } = buildChartData(workouts, "pull-up", "reps-based", repsOnlyConfig(""));

      expect(yLabel).toBe("Reps");
    });
  });

  describe("reps_weight mode", () => {
    it("includes only sets matching the reps target with weight > 0", () => {
      const workouts = [
        makeWorkout("w1", "bench-press", [
          makeSet(5, 80),
          makeSet(8, 60),
          makeSet(5, 0),
        ]),
      ];

      const { points } = buildChartData(workouts, "bench-press", "reps-based", repsWeightConfig("5"));

      expect(points).toHaveLength(1);
      expect(points[0].value).toBe(80);
      expect(points[0].sets).toHaveLength(1);
    });

    it("returns empty when repsTarget is not set", () => {
      const workouts = [makeWorkout("w1", "bench-press", [makeSet(5, 80)])];

      const { points } = buildChartData(workouts, "bench-press", "reps-based", repsWeightConfig(""));

      expect(points).toHaveLength(0);
    });
  });

  describe("exercise name matching", () => {
    it("ignores workouts without the selected exercise", () => {
      const workouts = [
        makeWorkout("w1", "pull-up", [makeSet(10, 0)]),
        makeWorkout("w2", "dip", [makeSet(15, 0)]),
      ];

      const { points } = buildChartData(workouts, "pull-up", "reps-based", repsOnlyConfig(""));

      expect(points).toHaveLength(1);
      expect(points[0].value).toBe(10);
    });
  });

  describe("edge cases", () => {
    it("returns empty points when exerciseName is empty", () => {
      const workouts = [makeWorkout("w1", "pull-up", [makeSet(10, 0)])];

      const { points, yLabel } = buildChartData(workouts, "", "reps-based", repsOnlyConfig(""));

      expect(points).toHaveLength(0);
      expect(yLabel).toBeNull();
    });

    it("returns empty points when config is null", () => {
      const workouts = [makeWorkout("w1", "pull-up", [makeSet(10, 0)])];

      const { points, yLabel } = buildChartData(workouts, "pull-up", "reps-based", null);

      expect(points).toHaveLength(0);
      expect(yLabel).toBeNull();
    });

    it("sorts points chronologically", () => {
      const workouts = [
        makeWorkout("w2", "pull-up", [makeSet(12, 0)], "2024-03-01T10:00:00Z"),
        makeWorkout("w1", "pull-up", [makeSet(8, 0)], "2024-01-01T10:00:00Z"),
      ];

      const { points } = buildChartData(workouts, "pull-up", "reps-based", repsOnlyConfig(""));

      expect(points[0].value).toBe(8);
      expect(points[1].value).toBe(12);
    });
  });
});
