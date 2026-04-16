"use client";

//libs
import Link from "next/link";
import { Edit, Eye, Trash2 } from "lucide-react";

//components
import { WorkoutHistoryStats } from "@/components/workout-history/workout-history-stats";
import { Loader } from "@/components/shared/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

//types
import type { IWorkoutTemplateItem } from "@/app/api/workout-templates/types";

type TemplateListItemProps = {
  template: IWorkoutTemplateItem;
  isDeletingThis: boolean;
  onView: (templateId: string) => void;
  onDeleteRequest: (templateId: string) => void;
};

export const TemplateListItem = ({
  template,
  isDeletingThis,
  onView,
  onDeleteRequest,
}: TemplateListItemProps) => {
  return (
    <li
      key={template.id}
      data-testid="workout-template-item"
      className={isDeletingThis ? "opacity-50 pointer-events-none" : ""}
    >
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="font-semibold text-lg mb-1">
                <span className="inline-block border-b-2 border-primary-element pb-1">
                  {template.name}
                </span>
              </div>
              {template.description && (
                <div className="text-sm text-muted-foreground">
                  {template.description}
                </div>
              )}
              <WorkoutHistoryStats
                exercisesCount={template.exercises?.length ?? 0}
                setsCount={
                  template.exercises?.reduce(
                    (sum, ex) => sum + (ex.sets?.length ?? 0),
                    0
                  ) ?? 0
                }
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="h-9 w-9 text-foreground"
              >
                <Link href={`/workout/template/${template.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onView(template.id)}
                className="h-9 w-9 text-foreground"
                aria-label="View template"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDeleteRequest(template.id)}
                className="h-9 w-9 text-destructive hover:text-destructive"
                aria-label="Delete template"
                disabled={isDeletingThis}
              >
                {isDeletingThis ? (
                  <Loader size={16} />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  );
};
