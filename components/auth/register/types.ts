import { z } from "zod";

export const getRegisterFormSchema = () =>
  z
    .object({
      fullName: z.string().min(1, "Full name is required"),
      email: z.email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords are not the same",
      path: ["confirmPassword"],
    });

export type RegisterFormType = z.infer<
  ReturnType<typeof getRegisterFormSchema>
>;
