import { Suspense } from "react";
import { ExerciseDatabase } from "@/components/exercises/exercise-database";
import { Loader } from "@/components/shared/loader";

export default function ExercisesPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ExerciseDatabase />
    </Suspense>
  );
}
