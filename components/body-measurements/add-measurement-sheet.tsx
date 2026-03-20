"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

// hooks
import { useForm } from "react-hook-form";

// components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/date-picker";
import { toast } from "sonner";

// types
import {
  addMeasurementFormSchema,
  AddMeasurementFormType,
  CIRCUMFERENCE_LABELS,
} from "./types";
import { useCreateBodyMeasurement } from "./api/use-create-body-measurement";
import type { IBodyMeasurementItem } from "@/app/api/body-measurements/types";
import {
  getDefaultValuesFromLast,
  buildMeasurementPayload,
  CIRCUMFERENCE_KEYS,
} from "./helpers";

interface AddMeasurementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastMeasurement?: IBodyMeasurementItem | null;
}

export const AddMeasurementSheet = ({
  open,
  onOpenChange,
  lastMeasurement = null,
}: AddMeasurementSheetProps) => {
  const form = useForm<
    AddMeasurementFormType,
    undefined,
    AddMeasurementFormType
  >({
    resolver: zodResolver(addMeasurementFormSchema),
    defaultValues: getDefaultValuesFromLast(lastMeasurement),
    mode: "onChange",
  });

  const { mutate: createMeasurement, isPending } = useCreateBodyMeasurement({
    onSuccess: () => {
      toast.success("Measurement saved");
      onOpenChange(false);
      form.reset(getDefaultValuesFromLast(lastMeasurement));
    },
    onError: (err) => {
      toast.error(err || "Failed to save measurement");
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValuesFromLast(lastMeasurement));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (values: AddMeasurementFormType) => {
    createMeasurement(buildMeasurementPayload(values));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex max-h-full w-full flex-col gap-0 overflow-auto p-0 sm:w-[70%] sm:max-w-[600px]">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="m-0">Add measurement</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-auto"
            noValidate
          >
            <div className="flex-1 space-y-6 p-6">
              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={999.9}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={999.9}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="measured_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Measurement date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={(date) => date > new Date()}
                          showClear={false}
                          fromYear={new Date().getFullYear() - 10}
                          toYear={new Date().getFullYear()}
                        />
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="measured_at_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Measurement time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value ?? ""}
                          className="max-w-full min-w-0"
                        />
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Circumferences (cm)</p>
                <div className="grid grid-cols-2 gap-4">
                  {CIRCUMFERENCE_KEYS.map((key) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={key}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{CIRCUMFERENCE_LABELS[key]}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min={0}
                              max={999.9}
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter className="border-t p-6">
              <Button
                type="submit"
                disabled={isPending || !form.formState.isDirty}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
