"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Loader } from "@/components/shared/loader";
import { WorkoutForm } from "./edit/workout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkoutProps {
  workoutId?: string | null;
}

const Workout = ({ workoutId }: WorkoutProps) => {
  const pathname = usePathname();
  const isTemplate = pathname?.includes("create-template");
  const isEditMode = !!workoutId;

  let title: string;
  switch (true) {
    case isTemplate:
      title = "Create New Template";
      break;
    case isEditMode:
      title = "Edit Workout";
      break;
    default:
      title = "Create New Workout";
      break;
  }

  return (
    <Suspense fallback={<Loader />}>
      <Card className="w-full xl:w-1/2">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutForm workoutId={workoutId} />
        </CardContent>
      </Card>
    </Suspense>
  );
};

export default Workout;
