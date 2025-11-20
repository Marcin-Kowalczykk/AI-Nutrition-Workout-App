import { Suspense } from "react";
import { Loader } from "@/components/shared/loader";
import { CreateNewWorkoutForm } from "./create-new-workout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CreateNewWorkout = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Card className="w-full xl:w-1/2">
        <CardHeader>
          <CardTitle>Create New Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateNewWorkoutForm />
        </CardContent>
      </Card>
    </Suspense>
  );
};

export default CreateNewWorkout;
