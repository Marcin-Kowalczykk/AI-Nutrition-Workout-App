"use client";

import { useState, useMemo } from "react";
import { startOfDay, endOfDay } from "date-fns";
import { Plus, Edit, Trash2 } from "lucide-react";

// components
import { Loader } from "@/components/shared/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePicker } from "@/components/shared/date-picker";
import { AddMeasurementSheet } from "./add-measurement-sheet";
import { EditMeasurementSheet } from "./edit-measurement-sheet";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import CenterWrapper from "@/components/shared/center-wrapper";
import { ErrorComponent } from "../shared/error-component";

// hooks
import { useGetBodyMeasurementsHistory } from "./api/use-get-body-measurements-history";
import { useDeleteBodyMeasurement } from "./api/use-delete-body-measurement";

// types
import type { IBodyMeasurementItem } from "@/app/api/body-measurements/types";
import { CIRCUMFERENCE_LABELS } from "./types";
import {
  CIRCUMFERENCE_KEYS,
  formatMeasurementDate,
  hasCircumference,
} from "./helpers";
import { toast } from "sonner";

export const BodyMeasurements = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [measurementToEdit, setMeasurementToEdit] =
    useState<IBodyMeasurementItem | null>(null);
  const [measurementToDelete, setMeasurementToDelete] = useState<string | null>(
    null
  );

  const { mutate: deleteMeasurement, isPending: isDeleting } =
    useDeleteBodyMeasurement({
      onSuccess: () => {
        toast.success("Measurement deleted");
        setMeasurementToDelete(null);
      },
      onError: (err) => {
        toast.error(err || "Failed to delete measurement");
      },
    });

  const startDateString = useMemo(
    () => (startDate ? startOfDay(startDate).toISOString() : undefined),
    [startDate]
  );

  const endDateString = useMemo(
    () => (endDate ? endOfDay(endDate).toISOString() : undefined),
    [endDate]
  );

  const { data, isLoading, error, isError } = useGetBodyMeasurementsHistory({
    startDate: startDateString,
    endDate: endDateString,
  });

  const { data: latestData } = useGetBodyMeasurementsHistory({
    enabled: addSheetOpen,
  });

  if (isLoading) {
    return (
      <CenterWrapper className="w-full items-center justify-center xl:w-1/2 text-center">
        <Loader />
      </CenterWrapper>
    );
  }

  if (isError) {
    return <ErrorComponent error={error} />;
  }

  const measurements = data?.measurements ?? [];
  const lastMeasurement =
    addSheetOpen && latestData?.measurements?.length
      ? latestData.measurements[0]
      : measurements[0] ?? null;
  const hasNoFilters = startDate === undefined && endDate === undefined;
  const isEmptyBackend = hasNoFilters && measurements.length === 0;

  if (isEmptyBackend) {
    return (
      <div className="justify-start xl:w-1/2 w-full">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              You don&apos;t have any measurements yet. Add your first entry to
              start tracking.
            </p>
            <Button
              className="mt-2 w-full"
              onClick={() => setAddSheetOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add measurement
            </Button>
          </CardContent>
        </Card>
        <AddMeasurementSheet
          open={addSheetOpen}
          onOpenChange={setAddSheetOpen}
          lastMeasurement={null}
        />
      </div>
    );
  }

  return (
    <div className="justify-start">
      <div className="flex flex-col mb-2 xl:w-1/2 w-full">
        <div className="flex flex-row gap-1">
          <div className="flex-1">
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date ?? undefined)}
              placeholder="start date"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date ?? undefined)}
              placeholder="end date"
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
          className="mt-2 w-full"
          onClick={() => setAddSheetOpen(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add measurement
        </Button>
      </div>

      {measurements.length === 0 ? (
        <Card className="xl:w-1/2 w-full">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              No results for the selected period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2 xl:w-1/2 w-full">
          {(() => {
            // const lastKnownHeight =
            //   measurements.find((x) => x.height_cm != null)?.height_cm ?? null;
            return measurements.map((m: IBodyMeasurementItem) => (
              <li key={m.id}>
                <Card className="w-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground border-b-2 border-primary-element pb-2 w-fit">
                          {formatMeasurementDate(m.measured_at)}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-base">
                          <span>
                            <strong>Waga:</strong> {m.weight_kg} kg
                          </span>
                          {m.height_cm != null && (
                            <span className="text-sm text-muted-foreground">
                              <strong>Wzrost:</strong> {m.height_cm} cm
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setMeasurementToEdit(m)}
                          className="h-9 w-9 text-foreground"
                          aria-label="Edit measurement"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setMeasurementToDelete(m.id)}
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          aria-label="Delete measurement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {hasCircumference(m) && (
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            {CIRCUMFERENCE_KEYS.map((key) => (
                              <TableHead
                                key={key}
                                className="text-center text-muted-foreground font-medium"
                              >
                                {CIRCUMFERENCE_LABELS[key]}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            {CIRCUMFERENCE_KEYS.map((key) => {
                              const val = m[key];
                              const display =
                                val != null && !Number.isNaN(Number(val))
                                  ? `${val} cm`
                                  : "—";
                              return (
                                <TableCell
                                  key={key}
                                  className="text-center"
                                >
                                  {display}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </li>
            ));
          })()}
        </ul>
      )}

      <AddMeasurementSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        lastMeasurement={lastMeasurement}
      />

      <EditMeasurementSheet
        open={measurementToEdit !== null}
        onOpenChange={(open) => !open && setMeasurementToEdit(null)}
        measurement={measurementToEdit}
      />

      <ConfirmModal
        open={measurementToDelete !== null}
        onOpenChange={(open) => !open && setMeasurementToDelete(null)}
        title="Delete measurement?"
        description="This will permanently delete this measurement. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={() => {
          if (measurementToDelete) deleteMeasurement(measurementToDelete);
        }}
        isPending={isDeleting}
      />
    </div>
  );
};
