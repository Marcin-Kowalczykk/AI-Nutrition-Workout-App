"use client";

import { useState } from "react";

// hooks
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteWorkout } from "../api/use-delete-workout";

// components
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { WorkoutView } from "./workout-view";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const ViewWorkoutSheet = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const workoutId = searchParams.get("workoutId");

  const isOpen = !!workoutId;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("workoutId");

    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl);
  };

  const handleEdit = (id: string) => {
    router.push(`/workout/edit?id=${id}`);
  };

  const { mutate: deleteWorkout, isPending: isDeleting } = useDeleteWorkout({
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["get-workout-history"] });
      handleClose();
      toast.success("Workout deleted");
    },
    onError: (err) => {
      toast.error(err || "Failed to delete workout");
    },
  });

  const handleConfirmDelete = () => {
    if (workoutId) deleteWorkout(workoutId);
  };

  return (
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
              <Button
                variant="outline"
                onClick={() => handleEdit(workoutId || "")}
              >
                <Pencil className="h-4 w-4 text-foreground" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-destructive hover:text-destructive"
                aria-label="Delete workout"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetTitle>
          <SheetDescription className="hidden" />
        </SheetHeader>
        <div className="flex-1 overflow-auto p-4">
          {workoutId && <WorkoutView workoutId={workoutId} />}
        </div>
      </SheetContent>

      <ConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete workout?"
        description="This will permanently delete this workout. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />
    </Sheet>
  );
};
