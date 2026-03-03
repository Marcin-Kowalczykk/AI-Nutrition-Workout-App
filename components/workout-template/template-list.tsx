"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// components
import { Loader } from "@/components/shared/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import CenterWrapper from "@/components/shared/center-wrapper";
import { useListTemplates } from "./api/use-list-templates";
import { useDeleteTemplate } from "./api/use-delete-template";
import { useQueryClient } from "@tanstack/react-query";
import { TEMPLATES_QUERY_KEY } from "./api/use-list-templates";
import { toast } from "sonner";

// types
import type { IWorkoutTemplateItem } from "@/app/api/workout-templates/types";
import { TemplateSearchInput } from "./template-search";
import { useTemplateSearch } from "./hooks/use-template-search";

export function TemplateList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [templateIdToDelete, setTemplateIdToDelete] = useState<string | null>(
    null
  );

  const handleView = (templateId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("templateId", templateId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const { data, isLoading, error, isError } = useListTemplates();

  const templates = data?.templates ?? [];
  const { search, setSearch, filteredTemplates, hasAnyTemplates } =
    useTemplateSearch(templates as IWorkoutTemplateItem[]);

  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
      setTemplateIdToDelete(null);
      toast.success("Template deleted");
    },
    onError: (err) => {
      toast.error(err || "Failed to delete template");
    },
  });

  if (isLoading) {
    return (
      <CenterWrapper className="flex w-full min-h-[50vh] items-center justify-center xl:w-1/2">
        <Loader />
      </CenterWrapper>
    );
  }

  if (isError) {
    return (
      <CenterWrapper>
        <div className="text-destructive">
          Error: {error?.message || "Failed to load templates"}
        </div>
      </CenterWrapper>
    );
  }

  return (
    <div className="w-full xl:w-1/2">
      <div className="flex items-center justify-between mb-2">
        <TemplateSearchInput value={search} onChange={setSearch} />
        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-9 w-9 text-foreground"
          aria-label="Create new template"
        >
          <Link href="/workout/template/create">
            <Plus className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {!hasAnyTemplates
            ? "No templates yet. Create your first template to reuse workout structure."
            : "No templates match your search."}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredTemplates.map((template: IWorkoutTemplateItem) => (
            <li key={template.id}>
              <Card className="w-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="font-semibold text-lg mb-1">
                        <span className="inline-block border-b-2 border-destructive pb-1">
                          {template.name}
                        </span>
                      </div>
                      {template.description && (
                        <div className="text-sm text-muted-foreground">
                          {template.description}
                        </div>
                      )}
                      {template.exercises && template.exercises.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {template.exercises.length} exercise
                          {template.exercises.length !== 1 ? "s" : ""}
                        </div>
                      )}
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
                        onClick={() => handleView(template.id)}
                        className="h-9 w-9 text-foreground"
                        aria-label="View template"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setTemplateIdToDelete(template.id)}
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        aria-label="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={templateIdToDelete !== null}
        onOpenChange={(open) => !open && setTemplateIdToDelete(null)}
        title="Delete template?"
        description="This will permanently delete this template. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() =>
          templateIdToDelete && deleteTemplate(templateIdToDelete)
        }
        isPending={isDeleting}
      />
    </div>
  );
}
