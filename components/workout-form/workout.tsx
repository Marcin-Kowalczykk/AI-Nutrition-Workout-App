"use client";

import { Suspense } from "react";
import { Loader } from "@/components/shared/loader";
import { WorkoutForm } from "./workout-form";
import { Card, CardContent } from "@/components/ui/card";

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
  return (
    <Suspense fallback={<Loader />}>
      <Card>
        <CardContent className="p-2 pt-3">
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
