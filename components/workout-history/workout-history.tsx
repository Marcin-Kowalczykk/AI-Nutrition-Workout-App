"use client";

import { useMemo, useState } from "react";
import { format, startOfDay, endOfDay, subMonths } from "date-fns";
import { pl } from "date-fns/locale";

// components
import { Loader } from "@/components/shared/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { toast } from "sonner";
import { PaginatedSection } from "../shared/pagination/paginated-section";
import { WorkoutHistorySearchInput } from "./workout-history-search";

// hooks
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useGetWorkoutHistory } from "./api/use-get-workout-history";
import { useDeleteWorkout } from "@/components/workout-form/api/use-delete-workout";
import { useWorkoutHistorySearch } from "./hooks/use-workout-history-search";

// types
import { IWorkoutItem } from "@/app/api/workouts/types";
import CenterWrapper from "../shared/center-wrapper";

const WorkoutHistory = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState<Date | undefined>(() =>
    subMonths(new Date(), 6)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const [workoutIdToDelete, setWorkoutIdToDelete] = useState<string | null>(
    null
  );
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);

  const startDateString = useMemo(() => {
    if (!startDate) return undefined;
    return startOfDay(startDate).toISOString();
  }, [startDate]);

  const endDateString = useMemo(() => {
    if (!endDate) return undefined;
    return endOfDay(endDate).toISOString();
  }, [endDate]);

  const { data, isLoading, error, isError } = useGetWorkoutHistory({
    startDate: startDateString,
    endDate: endDateString,
  });

  const { mutate: deleteWorkout, isPending: isDeleting } = useDeleteWorkout({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-workout-history"] });
      setDeletingWorkoutId(null);
      toast.success("Workout deleted");
    },
    onError: (err) => {
      setDeletingWorkoutId(null);
      toast.error(err || "Failed to delete workout");
    },
  });

  const workouts = useMemo(() => data?.workouts || [], [data?.workouts]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy", { locale: pl });
  };

  const handleView = (workoutId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("workoutId", workoutId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleEdit = (workoutId: string) => {
    router.push(`/workout/edit?id=${workoutId}`);
  };

  const handleConfirmDelete = () => {
    if (workoutIdToDelete) {
      setDeletingWorkoutId(workoutIdToDelete);
      setWorkoutIdToDelete(null);
      deleteWorkout(workoutIdToDelete);
    }
  };

  const { search, setSearch, filteredWorkouts, hasAnyWorkouts } =
    useWorkoutHistorySearch(workouts);

  if (isLoading) {
    return (
      <CenterWrapper className="w-full xl:w-1/2">
        <Loader />
      </CenterWrapper>
    );
  }

  if (isError) {
    return (
      <CenterWrapper>
        <div className="text-primary-element">
          Error: {error?.message || "Failed to load workout history"}
        </div>
      </CenterWrapper>
    );
  }

  return (
    <div className="justify-start">
      <div className="flex flex-col mb-2 xl:w-1/2 w-full gap-2">
        <WorkoutHistorySearchInput value={search} onChange={setSearch} />
        <div className="flex flex-row gap-1">
          <div className="flex-1">
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date || undefined)}
              placeholder="select start date"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date || undefined)}
              placeholder="select end date"
              disabled={(date) => {
                const d = startOfDay(date);
                const today = startOfDay(new Date());
                if (d > today) return true;
                if (startDate) return d < startOfDay(startDate);
                return false;
              }}
            />
          </div>
        </div>
      </div>

      <PaginatedSection
        items={filteredWorkouts}
        initialPageSize={8}
        pageSizeOptions={[8, 15, 20, 30, 50]}
        className="xl:w-1/2 w-full flex flex-col gap-2"
        controlsWrapperClassName="mb-2"
      >
        {(paginatedWorkouts) => (
          <ul className="flex flex-col gap-2">
            {paginatedWorkouts.map((workout: IWorkoutItem) => (
              <li key={workout.id} data-testid="workout-history-item" className={deletingWorkoutId === workout.id ? "opacity-50 pointer-events-none" : ""}>
                <Card className="w-full">
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground border-b-2 border-primary-element pb-2 w-fit">
                          {formatDate(workout.created_at)}
                        </div>
                        <div className="font-semibold text-lg">
                          {workout.name}
                        </div>
                        {workout.description && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {workout.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(workout.id)}
                          className="h-9 w-9 text-foreground"
                          aria-label="Edit workout"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleView(workout.id)}
                          className="h-9 w-9 text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setWorkoutIdToDelete(workout.id)}
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          aria-label="Delete workout"
                          disabled={deletingWorkoutId === workout.id}
                        >
                          {deletingWorkoutId === workout.id ? <Loader size={16} /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </PaginatedSection>

      {!hasAnyWorkouts && (
        <Card className="mt-2 xl:w-1/2 w-full">
          <CardContent>
            <ul className="text-sm text-muted-foreground py-2 mb-3">
              <li>No workouts in the selected date range.</li>
              <li>Try adjusting the date filters or create a new workout.</li>
              <li>You can also create a template to reuse it later.</li>
            </ul>
            <Button
              onClick={() => router.push(EnableRoutes.CreateNewWorkout)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create your first workout
            </Button>
          </CardContent>
        </Card>
      )}

      {hasAnyWorkouts && filteredWorkouts.length === 0 && (
        <Card className="mt-2 xl:w-1/2 w-full">
          <CardContent>
            <ul className="text-sm text-muted-foreground py-2">
              <li>No workouts match your search.</li>
              <li>Try changing the search phrase or date filters.</li>
            </ul>
          </CardContent>
        </Card>
      )}

      <ConfirmModal
        open={workoutIdToDelete !== null}
        onOpenChange={(open) => !open && setWorkoutIdToDelete(null)}
        title="Delete workout?"
        description="This will permanently delete this workout. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />
    </div>
  );
};

export default WorkoutHistory;
