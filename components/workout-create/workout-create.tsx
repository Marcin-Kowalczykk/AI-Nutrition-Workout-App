"use client";

import { useState } from "react";
import Workout from "../workout-form/components/workout";
import { useListTemplates } from "../workout-template/api/use-list-templates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { IWorkoutTemplateItem } from "@/app/api/workout-templates/types";

const NONE_TEMPLATE_VALUE = "__none__";

const WorkoutCreate = () => {
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<string>(NONE_TEMPLATE_VALUE);
  const { data: templatesData } = useListTemplates();
  const templates = templatesData?.templates ?? [];

  const prefillId =
    selectedTemplateId && selectedTemplateId !== NONE_TEMPLATE_VALUE
      ? selectedTemplateId
      : undefined;

  return (
    <div className="flex flex-col gap-4 w-full xl:w-1/2 min-w-0">
      {templates.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="template-select">Start from template</Label>
          <Select
            value={selectedTemplateId}
            onValueChange={(value) =>
              setSelectedTemplateId(value ?? NONE_TEMPLATE_VALUE)
            }
          >
            <SelectTrigger id="template-select" className="w-full max-w-xs">
              <SelectValue placeholder="Choose a template (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_TEMPLATE_VALUE}>None</SelectItem>
              {templates.map((t: IWorkoutTemplateItem) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Workout prefillFromTemplateId={prefillId} />
    </div>
  );
};

export default WorkoutCreate;
