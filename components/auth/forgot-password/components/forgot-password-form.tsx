"use client";

// dependencies
import { Suspense, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

// hooks
import { useForm } from "react-hook-form";
import { useForgotPassword } from "../api/use-forgot-password";

// components
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/shared/loader";

// types and schemas
import { ForgotPasswordFormType, getForgotPasswordFormSchema } from "../types";

const ForgotPasswordFormContent = () => {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const {
    mutate: sendResetLink,
    isPending,
    isError,
    isSuccess,
  } = useForgotPassword();

  const form = useForm<ForgotPasswordFormType>({
    resolver: zodResolver(getForgotPasswordFormSchema()),
    defaultValues: {
      email: "",
    },
  });

  const onSubmitHandler = async (values: ForgotPasswordFormType) => {
    const { email } = values;

    sendResetLink(
      { email },
      {
        onSuccess: () => {
          setSubmittedEmail(email);
        },
      }
    );
  };

  if (isSuccess && submittedEmail) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center py-4 text-success">
          <h2 className="text-xl font-semibold mb-2">Check your email</h2>
          <p className="mb-2">
            We&apos;ve sent a password reset link to{" "}
            <strong>{submittedEmail}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Please check your email and click on the link to reset your
            password.
          </p>
        </div>
        <Button type="button" variant="secondary" asChild>
          <Link href="/login">← Back to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} noValidate>
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm mb-2">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="example@example.com"
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isError && (
            <FormMessage className="text-primary-element text-center">
              Failed to send reset link. Please check your email and try again.
            </FormMessage>
          )}
          <Button type="submit" variant="default" disabled={isPending}>
            {isPending ? <Loader /> : "Send Reset Link"}
          </Button>
          <Button type="button" variant="outline" disabled={isPending} asChild>
            <Link href="/login">← Back to Login</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export const ForgotPasswordForm = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ForgotPasswordFormContent />
    </Suspense>
  );
};
