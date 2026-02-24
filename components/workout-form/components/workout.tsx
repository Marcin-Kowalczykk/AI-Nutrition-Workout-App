"use client";

import { Suspense } from "react";
import { Loader } from "@/components/shared/loader";
import { WorkoutForm } from "./edit/workout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkoutProps {
  workoutId?: string | null;
  isTemplateMode?: boolean;
  templateId?: string | null;
  prefillFromTemplateId?: string | null;
}

const Workout = ({
  workoutId,
  isTemplateMode = false,
  templateId,
  prefillFromTemplateId,
}: WorkoutProps) => {
  let title: string;
  if (isTemplateMode) {
    title = templateId ? "Edit Template" : "Create New Template";
  } else {
    title = workoutId ? "Edit Workout" : "Create New Workout";
  }

  return (
    <Suspense fallback={<Loader />}>
      <Card className="w-full xl:w-1/2 min-w-0 shrink-0">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutForm
            workoutId={workoutId}
            isTemplateMode={isTemplateMode}
            templateId={templateId}
            prefillFromTemplateId={prefillFromTemplateId}
          />
        </CardContent>
      </Card>
    </Suspense>
  );
};

export default Workout;
