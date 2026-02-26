import { useMemo, useState } from "react";

import type { IWorkoutTemplateItem } from "@/app/api/workout-templates/types";

export const useTemplateSelectSearch = (
  templates: IWorkoutTemplateItem[],
) => {
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    const all = templates ?? [];
    const searchLower = search.trim().toLowerCase();

    if (!searchLower) return all;

    return all.filter((template: IWorkoutTemplateItem) => {
      const name = template.name?.toLowerCase() ?? "";
      const description = template.description?.toLowerCase() ?? "";
      return name.includes(searchLower) || description.includes(searchLower);
    });
  }, [templates, search]);

  return {
    search,
    setSearch,
    filteredTemplates,
  };
};

