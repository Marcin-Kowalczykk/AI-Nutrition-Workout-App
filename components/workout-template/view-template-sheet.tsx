"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteTemplate } from "./api/use-delete-template";
import { TEMPLATES_QUERY_KEY } from "./api/use-list-templates";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TemplateView } from "./template-view";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ViewTemplateSheet() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const templateId = searchParams.get("templateId");

  const isOpen = !!templateId;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("templateId");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.replace(newUrl);
  };

  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate({
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
      handleClose();
      toast.success("Template deleted");
    },
    onError: (err) => {
      toast.error(err || "Failed to delete template");
    },
  });

  const handleConfirmDelete = () => {
    if (templateId) deleteTemplate(templateId);
  };

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteModalOpen(false);
            handleClose();
          }
        }}
      >
        <SheetContent className="flex max-h-full w-full flex-col gap-0 overflow-auto p-0 sm:w-[70%] sm:max-w-[600px]">
          <SheetHeader className="border-b p-6">
            <SheetTitle className="flex items-center justify-between m-0">
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link
                    href={
                      templateId ? `/workout/template/${templateId}/edit` : "#"
                    }
                  >
                    <Pencil className="h-4 w-4 text-foreground" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-destructive hover:text-destructive"
                  aria-label="Delete template"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </SheetTitle>
            <SheetDescription className="hidden" />
          </SheetHeader>
          <div className="flex-1 overflow-auto px-6 py-6">
            {templateId && <TemplateView templateId={templateId} />}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete template?"
        description="This will permanently delete this template. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />
    </>
  );
}
