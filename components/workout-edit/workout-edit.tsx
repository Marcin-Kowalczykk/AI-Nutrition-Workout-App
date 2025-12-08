import { useSearchParams } from "next/navigation";
import Workout from "../workout-form/components/workout";
import { Suspense } from "react";
import { Loader } from "../shared/loader";

const WorkoutEditContent = () => {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get("id");

  return <Workout workoutId={workoutId} />;
};

const WorkoutEdit = () => {
  return (
    <Suspense fallback={<Loader />}>
      <WorkoutEditContent />
    </Suspense>
  );
};

export default WorkoutEdit;
