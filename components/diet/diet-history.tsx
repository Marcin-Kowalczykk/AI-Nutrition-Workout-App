"use client";

import { useMemo, useState } from "react";
import { subMonths, startOfDay, endOfDay } from "date-fns";
import { Plus } from "lucide-react";

//components
import { Loader } from "@/components/shared/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { PaginatedSection } from "@/components/shared/pagination/paginated-section";
import { DietDayCard } from "./diet-day-card";
import { AddEditDietDaySheet } from "./add-edit-diet-day-sheet";
import CenterWrapper from "@/components/shared/center-wrapper";
import { ErrorComponent } from "@/components/shared/error-component";
import { toast } from "sonner";

//hooks
import { useGetDietHistory } from "./api/use-get-diet-history";
import { useDeleteDietDay } from "./api/use-delete-diet-day";

//types
import type { IDietDay } from "@/app/api/diet/types";

const DietHistory = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(() =>
    subMonths(new Date(), 6)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [dayToEdit, setDayToEdit] = useState<IDietDay | null>(null);
  const [dayToDelete, setDayToDelete] = useState<string | null>(null);
  const [deletingDayId, setDeletingDayId] = useState<string | null>(null);

  const startDateString = useMemo(
    () => (startDate ? startOfDay(startDate).toISOString() : undefined),
    [startDate]
  );

  const endDateString = useMemo(
    () => (endDate ? endOfDay(endDate).toISOString() : undefined),
    [endDate]
  );

  const { data, isLoading, isError, error } = useGetDietHistory({
    startDate: startDateString,
    endDate: endDateString,
  });

  const { mutate: deleteDay, isPending: isDeleting } = useDeleteDietDay({
    onSuccess: () => {
      setDeletingDayId(null);
      toast.success("Diet day deleted");
    },
    onError: (err) => {
      setDeletingDayId(null);
      toast.error(err || "Failed to delete diet day");
    },
  });

  const days = useMemo(() => data?.days ?? [], [data?.days]);

  if (isLoading) {
    return (
      <CenterWrapper className="w-full xl:w-1/2">
        <Loader />
      </CenterWrapper>
    );
  }

  if (isError) {
    return <ErrorComponent error={error} />;
  }

  return (
    <div className="justify-start">
      <div className="flex flex-col mb-2 xl:w-1/2 w-full gap-2">
        <div className="flex flex-row gap-1">
          <div className="flex-1">
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date ?? undefined)}
              placeholder="select start date"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date ?? undefined)}
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
        <Button
          className="w-full"
          onClick={() => setAddSheetOpen(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add diet day
        </Button>
      </div>

      {days.length === 0 ? (
        <Card className="xl:w-1/2 w-full">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              No diet entries for the selected period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <PaginatedSection
          items={days}
          initialPageSize={8}
          pageSizeOptions={[8, 15, 20, 30, 50]}
          className="xl:w-1/2 w-full flex flex-col gap-2"
          controlsWrapperClassName="mb-2"
        >
          {(paginatedDays) => (
            <ul className="flex flex-col gap-2">
              {paginatedDays.map((day: IDietDay) => (
                <li key={day.id} data-testid="diet-day-item">
                  <DietDayCard
                    day={day}
                    onEdit={(d) => setDayToEdit(d)}
                    onDelete={(id) => setDayToDelete(id)}
                    isDeleting={deletingDayId === day.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </PaginatedSection>
      )}

      <AddEditDietDaySheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
      />

      <AddEditDietDaySheet
        open={dayToEdit !== null}
        onOpenChange={(open) => !open && setDayToEdit(null)}
        dayToEdit={dayToEdit}
      />

      <ConfirmModal
        open={dayToDelete !== null}
        onOpenChange={(open) => !open && setDayToDelete(null)}
        title="Delete diet day?"
        description="This will permanently delete this diet day and all its meals. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (dayToDelete) {
            setDeletingDayId(dayToDelete);
            setDayToDelete(null);
            deleteDay(dayToDelete);
          }
        }}
        isPending={isDeleting}
      />
    </div>
  );
};

export default DietHistory;
