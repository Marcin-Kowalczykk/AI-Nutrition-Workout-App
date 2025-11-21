import { Suspense } from "react";
import { Loader } from "@/components/shared/loader";
import { WorkoutForm } from "./workout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Workout = () => (
  <Suspense fallback={<Loader />}>
    <Card className="w-full xl:w-1/2">
      <CardHeader>
        <CardTitle>Create New Workout</CardTitle>
      </CardHeader>
      <CardContent>
        <WorkoutForm />
      </CardContent>
    </Card>
  </Suspense>
);

export default Workout;
