"use client";

// hooks
import { useSearchParams, useRouter, usePathname } from "next/navigation";

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
import { Pencil } from "lucide-react";

export const ViewWorkoutSheet = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const workoutId = searchParams.get("workoutId");

  const isOpen = !!workoutId;

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("workoutId");

    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl);
  };

  const handleEdit = (workoutId: string) => {
    router.push(`/workout/edit?id=${workoutId}`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="flex max-h-screen w-full flex-col gap-0 overflow-auto p-0 sm:w-[70%] sm:max-w-[600px]">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="flex items-center justify-between m-0">
            <Button
              variant="outline"
              onClick={() => handleEdit(workoutId || "")}
            >
              <Pencil className="h-4 w-4 text-destructive" />
              Edit
            </Button>
          </SheetTitle>
          <SheetDescription className="hidden" />
        </SheetHeader>
        <div className="flex-1 overflow-auto px-6 py-6">
          {workoutId && <WorkoutView workoutId={workoutId} />}
        </div>
      </SheetContent>
    </Sheet>
  );
};
