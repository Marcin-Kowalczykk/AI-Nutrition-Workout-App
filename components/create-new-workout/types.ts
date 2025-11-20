import { z } from "zod";

export const getCreateWorkoutFormSchema = () =>
  z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
  });

export type CreateWorkoutFormType = z.infer<
  ReturnType<typeof getCreateWorkoutFormSchema>
>;
