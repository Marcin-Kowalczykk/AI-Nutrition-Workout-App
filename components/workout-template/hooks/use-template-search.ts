import { useMemo, useState } from "react";

import type { IWorkoutTemplateItem } from "@/app/api/workout-templates/types";

export const useTemplateSearch = (templates: IWorkoutTemplateItem[]) => {
  const [search, setSearch] = useState("");

  const { filteredTemplates, hasAnyTemplates } = useMemo(() => {
    const all = templates ?? [];
    const searchLower = search.trim().toLowerCase();

    if (!searchLower) {
      return { filteredTemplates: all, hasAnyTemplates: all.length > 0 };
    }

    const filtered = all.filter((template: IWorkoutTemplateItem) => {
      const name = template.name?.toLowerCase() ?? "";
      const description = template.description?.toLowerCase() ?? "";
      return name.includes(searchLower) || description.includes(searchLower);
    });

    return {
      filteredTemplates: filtered,
      hasAnyTemplates: all.length > 0,
    };
  }, [templates, search]);

  return {
    search,
    setSearch,
    filteredTemplates,
    hasAnyTemplates,
  };
};

