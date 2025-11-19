import { z } from "zod";

export const getForgotPasswordFormSchema = () =>
  z.object({
    email: z.email("Invalid email address"),
  });

export type ForgotPasswordFormType = z.infer<
  ReturnType<typeof getForgotPasswordFormSchema>
>;
