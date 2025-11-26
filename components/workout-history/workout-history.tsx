"use client";

import { useState, useMemo } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { pl } from "date-fns/locale";

// components
import { Loader } from "@/components/shared/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";

// hooks
import { useGetWorkoutHistory } from "./api/use-get-workout-history";

// types
import { IWorkoutItem } from "@/app/api/workouts/types";
import CenterWrapper from "../shared/center-wrapper";

const WorkoutHistory = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Format dates to ISO string for API using date-fns
  // startDate: end of day (23:59:59) - for "from this date backwards" (lte)
  // endDate: start of day (00:00:00) - for range filtering (gte) to include the entire day
  const startDateString = useMemo(() => {
    if (!startDate) return undefined;
    return endOfDay(startDate).toISOString();
  }, [startDate]);

  const endDateString = useMemo(() => {
    if (!endDate) return undefined;
    return startOfDay(endDate).toISOString();
  }, [endDate]);

  const { data, isLoading, error, isError } = useGetWorkoutHistory({
    startDate: startDateString,
    endDate: endDateString,
  });

  if (isLoading) {
    return (
      <CenterWrapper>
        <Loader />
      </CenterWrapper>
    );
  }

  if (isError) {
    return (
      <CenterWrapper>
        <div className="text-destructive">
          Error: {error?.message || "Failed to load workout history"}
        </div>
      </CenterWrapper>
    );
  }

  const workouts = data?.workouts || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy", { locale: pl });
  };

  const handleView = (workoutId: string) => {
    // TODO: Navigate to workout view page
    console.log("View workout:", workoutId);
  };

  const handleEdit = (workoutId: string) => {
    // TODO: Navigate to workout edit page
    console.log("Edit workout:", workoutId);
  };

  return (
    <div className="justify-start">
      <div className="flex flex-col gap-4 mb-6 xl:w-1/2 w-full">
        <div className="flex flex-row gap-4">
          <div className="flex-1">
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date)}
              label="Start date"
              placeholder="select start date"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date)}
              label="End date"
              placeholder="select end date"
              disabled={(date) => {
                if (startDate) {
                  return date > startDate;
                }
                return false;
              }}
            />
          </div>
        </div>
        {(startDate || endDate) && (
          <Button
            variant="outline"
            onClick={() => {
              setStartDate(undefined);
              setEndDate(undefined);
            }}
            className="w-fit"
          >
            Wyczyść filtry
          </Button>
        )}
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No workouts found. Start creating your first workout!
        </div>
      ) : (
        <div className="flex flex-col gap-2 xl:w-1/2 w-full">
          {workouts.map((workout: IWorkoutItem) => (
            <Card key={workout.id} className="w-full">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="text-sm text-destructive">
                      {formatDate(workout.created_at)}
                    </div>
                    <div className="font-semibold text-lg">{workout.name}</div>
                    {workout.description && (
                      <div className="text-sm text-muted-foreground">
                        {workout.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleView(workout.id)}
                      className="h-9 w-9"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(workout.id)}
                      className="h-9 w-9"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutHistory;
