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
import { IWorkoutTemplateItem } from "@/app/api/workout-templates/types";
import { TemplateSelectSearchInput } from "./template-select-search";
import { useTemplateSelectSearch } from "./hooks/use-template-select-search";

const WorkoutCreate = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const { data: templatesData } = useListTemplates();
  const templates = templatesData?.templates ?? [];
  const { search, setSearch, filteredTemplates } =
    useTemplateSelectSearch(templates as IWorkoutTemplateItem[]);

  const prefillId = selectedTemplateId || undefined;

  return (
    <div className="flex flex-col gap-4 w-full xl:w-1/2 min-w-0">
      {templates.length > 0 && (
        <div className="space-y-2">
          <Select
            value={selectedTemplateId}
            onValueChange={(value) => setSelectedTemplateId(value)}
          >
            <SelectTrigger id="template-select" className="w-full">
              <SelectValue placeholder="Select from template (optional)" />
            </SelectTrigger>
            <SelectContent className="w-(--radix-select-trigger-width)">
              <div className="p-2 border-b border-border">
                <TemplateSelectSearchInput value={search} onChange={setSearch} />
              </div>
              {filteredTemplates.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No templates match your search.
                </div>
              ) : (
                filteredTemplates.map((t: IWorkoutTemplateItem) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      <Workout prefillFromTemplateId={prefillId} />
    </div>
  );
};

export default WorkoutCreate;
