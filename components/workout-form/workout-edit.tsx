import { useSearchParams } from "next/navigation";
import Workout from "./workout";
import { Suspense } from "react";
import { Loader } from "@/components/shared/loader";

const WorkoutEditContent = () => {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get("id");
  return <Workout workoutId={workoutId} />;
};

const WorkoutEdit = () => (
  <Suspense fallback={<Loader />}>
    <WorkoutEditContent />
  </Suspense>
);

export default WorkoutEdit;
