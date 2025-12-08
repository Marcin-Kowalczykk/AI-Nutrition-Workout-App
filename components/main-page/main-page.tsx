"use client";

// components
import WorkoutHistory from "../workout-history/workout-history";
import { ViewWorkoutSheet } from "../workout-form/components/view/view-workout-sheet";
import { Suspense } from "react";
import { Loader } from "../shared/loader";

const MainPage = () => {
  return (
    <>
      <Suspense fallback={<Loader />}>
        <WorkoutHistory />
      </Suspense>
      <Suspense fallback={null}>
        <ViewWorkoutSheet />
      </Suspense>
    </>
  );
};

export default MainPage;
