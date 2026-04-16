"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// libs
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// hooks
import { useListTemplates } from "./api/use-list-templates";
import { useDeleteTemplate } from "./api/use-delete-template";
import { TEMPLATES_QUERY_KEY } from "./api/use-list-templates";
import { useTemplateSearch } from "./hooks/use-template-search";

// types
import type { IWorkoutTemplateItem } from "@/app/api/workout-templates/types";

// components
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import CenterWrapper from "@/components/shared/center-wrapper";
import { Loader } from "@/components/shared/loader";
import { CreateTemplateRedirectButton } from "./create-template-redirect-button";
import { TemplateSearchInput } from "./template-search";
import { TemplateListItem } from "./components/template-list-item";

export function TemplateList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [templateIdToDelete, setTemplateIdToDelete] = useState<string | null>(
    null
  );
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

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
      setDeletingTemplateId(null);
      toast.success("Template deleted");
    },
    onError: (err) => {
      setDeletingTemplateId(null);
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

  if (!hasAnyTemplates) {
    return (
      <Card>
        <CardContent className="flex items-center  justify-between gap-2 py-2">
          <ul className="text-sm text-muted-foreground">
            <li>No templates found.</li>
            <li>Create your first template to reuse workout structure.</li>
          </ul>
          <CreateTemplateRedirectButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full xl:w-1/2">
      <div className="flex items-center justify-between mb-2">
        <TemplateSearchInput value={search} onChange={setSearch} />
        <CreateTemplateRedirectButton />
      </div>

      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent>
            <ul className="text-sm text-muted-foreground py-4 text-center">
              <li>No templates found for your search.</li>
            </ul>
          </CardContent>
        </Card>
      ) : (
        <ul className="relative flex flex-col gap-2 pl-5">
          <div className="pointer-events-none absolute bottom-3 left-2 top-1 w-[2.5px] rounded-full bg-linear-to-b from-primary-element via-primary-element/20 to-transparent" />
          {filteredTemplates.map((template: IWorkoutTemplateItem) => (
            <TemplateListItem
              key={template.id}
              template={template}
              isDeletingThis={deletingTemplateId === template.id}
              onView={handleView}
              onDeleteRequest={setTemplateIdToDelete}
            />
          ))}
        </ul>
      )}

      <ConfirmModal
        open={templateIdToDelete !== null}
        onOpenChange={(open) => !open && setTemplateIdToDelete(null)}
        title="Delete template?"
        description="This will permanently delete this template. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (templateIdToDelete) {
            setDeletingTemplateId(templateIdToDelete);
            setTemplateIdToDelete(null);
            deleteTemplate(templateIdToDelete);
          }
        }}
        isPending={isDeleting}
      />
    </div>
  );
}
