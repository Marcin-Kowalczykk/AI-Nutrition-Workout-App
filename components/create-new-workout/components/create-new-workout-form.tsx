"use client";

// dependencies
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

// hooks
import { useForm } from "react-hook-form";
import { useCreateWorkout } from "../api/use-create-workout";
import { useUpdateWorkout } from "../api/use-update-workout";

// components
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/shared/loader";
import { toast } from "sonner";

// types and schemas
import { CreateWorkoutFormType, getCreateWorkoutFormSchema } from "../types";

export const CreateNewWorkoutForm = () => {
  const router = useRouter();
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [isFirstSave, setIsFirstSave] = useState(true);

  const {
    mutate: createWorkout,
    isPending: isCreating,
    isError: isCreateError,
    error: createError,
  } = useCreateWorkout({
    onSuccess: (data) => {
      setWorkoutId(data.id);
      setIsFirstSave(false);
      toast.success("Workout created successfully");
    },
    onError: (error) => {
      toast.error(error || "Failed to create workout. Please try again.");
    },
  });

  const {
    mutate: updateWorkout,
    isPending: isUpdating,
    isError: isUpdateError,
    error: updateError,
  } = useUpdateWorkout({
    onSuccess: () => {
      toast.success("Workout updated successfully");
    },
    onError: (error) => {
      toast.error(error || "Failed to update workout. Please try again.");
    },
  });

  const form = useForm<CreateWorkoutFormType>({
    resolver: zodResolver(getCreateWorkoutFormSchema()),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const isPending = isCreating || isUpdating;
  const isError = isCreateError || isUpdateError;
  const error = createError || updateError;

  const onSubmitHandler = async (values: CreateWorkoutFormType) => {
    const { name, description } = values;
    const currentDate = new Date().toISOString();

    if (isFirstSave && !workoutId) {
      createWorkout({
        name,
        description: description || undefined,
        start_date: currentDate,
      });
    } else if (workoutId) {
      updateWorkout({
        id: workoutId,
        name,
        description: description || undefined,
        end_date: currentDate,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} noValidate>
        <div className="flex flex-col gap-4">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workout Name*</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Enter workout name"
                    autoComplete="off"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="description"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Enter workout description (optional)"
                    autoComplete="off"
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>
                  Optional description for your workout
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {isError && (
            <FormMessage className="text-destructive text-center">
              {error?.message || "Failed to save workout. Please try again."}
            </FormMessage>
          )}

          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? (
              <Loader />
            ) : isFirstSave ? (
              "Save Workout"
            ) : (
              "Update Workout"
            )}
          </Button>

          <Button type="button" variant="outline" asChild>
            <Link href="/main-page">← Back to Main Page</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
};
