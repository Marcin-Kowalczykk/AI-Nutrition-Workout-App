"use client";

import { useGetTemplate } from "./api/use-get-template";
import { Loader } from "@/components/shared/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CenterWrapper from "@/components/shared/center-wrapper";
import type {
  IWorkoutTemplateExerciseItem,
  IWorkoutTemplateSetItem,
} from "@/app/api/workout-templates/types";

interface TemplateViewProps {
  templateId: string;
}

export function TemplateView({ templateId }: TemplateViewProps) {
  const {
    data: templateData,
    isLoading,
    isError,
    error,
  } = useGetTemplate({
    templateId,
    enabled: !!templateId,
  });

  if (isLoading) {
    return (
      <CenterWrapper>
        <Loader />
      </CenterWrapper>
    );
  }

  if (isError || !templateData) {
    return (
      <CenterWrapper>
        <div className="text-center text-primary-element">
          {error?.message || "Failed to load template"}
        </div>
      </CenterWrapper>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 flex-1">
        <label className="text-sm font-medium text-muted-foreground">
          Template name
        </label>
        <p className="text-base font-semibold">{templateData.name || "-"}</p>
      </div>

      {templateData.description && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Description
          </label>
          <p className="text-base">{templateData.description}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-muted-foreground">
          Exercises
        </label>

        {!templateData.exercises || templateData.exercises.length === 0 ? (
          <p className="text-muted-foreground text-sm">No exercises added</p>
        ) : (
          templateData.exercises.map(
            (exercise: IWorkoutTemplateExerciseItem) => (
              <Card key={exercise.id}>
                <CardHeader>
                  <CardTitle>{exercise.name || "Unnamed Exercise"}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {!exercise.sets || exercise.sets.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No sets added
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-12 gap-2 pb-2 border-b">
                        <div className="col-span-2 text-xs font-medium text-muted-foreground text-center">
                          Set
                        </div>
                        <div className="col-span-2 text-xs font-medium text-muted-foreground text-center">
                          Reps
                        </div>
                        <div className="col-span-2 text-xs font-medium text-muted-foreground text-center">
                          Weight
                        </div>
                        <div className="col-span-3 text-xs font-medium text-muted-foreground text-center">
                          Duration
                        </div>
                      </div>

                      {exercise.sets.map((set: IWorkoutTemplateSetItem) => (
                        <div
                          key={set.id}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <div className="col-span-2 text-sm text-center">
                            {set.set_number ?? "-"}
                          </div>
                          <div className="col-span-2 text-sm text-center">
                            {set.reps !== undefined ? set.reps : "-"}
                          </div>
                          <div className="col-span-2 text-sm text-center">
                            {set.weight !== undefined
                              ? `${set.weight} kg`
                              : "-"}
                          </div>
                          <div className="col-span-3 text-sm text-center">
                            {set.duration !== undefined
                              ? `${set.duration} s`
                              : "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          )
        )}
      </div>
    </div>
  );
}
