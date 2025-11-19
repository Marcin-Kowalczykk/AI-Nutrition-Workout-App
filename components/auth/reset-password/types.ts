import { z } from "zod";

export const getResetPasswordFormSchema = () =>
  z
    .object({
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords are not the same",
      path: ["confirmPassword"],
    });

export type ResetPasswordFormType = z.infer<
  ReturnType<typeof getResetPasswordFormSchema>
>;
