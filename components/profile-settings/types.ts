import { z } from "zod";

export const getProfileSettingsFormSchema = () =>
  z
    .object({
      fullName: z.string().min(1, "Full name is required"),
      theme: z.string().optional(),
      password: z.string().optional(),
      confirmPassword: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.password && !data.confirmPassword) {
          return false;
        }
        return true;
      },
      {
        message: "Please confirm your password",
        path: ["confirmPassword"],
      }
    )
    .refine(
      (data) => {
        if (data.password && data.password.length < 6) {
          return false;
        }
        return true;
      },
      {
        message: "Password must be at least 6 characters",
        path: ["password"],
      }
    )
    .refine(
      (data) => {
        if (data.password && data.password !== data.confirmPassword) {
          return false;
        }
        return true;
      },
      {
        message: "Passwords are not the same",
        path: ["confirmPassword"],
      }
    );

export type ProfileSettingsFormType = z.infer<
  ReturnType<typeof getProfileSettingsFormSchema>
>;
