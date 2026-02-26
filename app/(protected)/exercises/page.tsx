import { Suspense } from "react";
import { Exercises } from "@/components/exercises/exercises";
import { Loader } from "@/components/shared/loader";

export default function ExercisesPage() {
  return (
    <Suspense fallback={<Loader />}>
      <Exercises />
    </Suspense>
  );
}
