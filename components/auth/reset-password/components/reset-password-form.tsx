"use client";

// dependencies
import { Suspense, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

// hooks
import { useForm } from "react-hook-form";
import { useResetPassword } from "../api/use-reset-password";
import { createClient } from "@/lib/supabase/client";

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
import { PasswordInput } from "@/components/shared/password-input";
import { Loader } from "@/components/shared/loader";

// types and schemas
import { ResetPasswordFormType, getResetPasswordFormSchema } from "../types";

const ResetPasswordFormContent = () => {
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    mutate: resetPassword,
    isPending,
    isError,
    isSuccess,
  } = useResetPassword();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!user && !authError) {
          const searchParams = new URLSearchParams(window.location.search);
          const hasTokens =
            searchParams.has("access_token") ||
            searchParams.has("refresh_token");

          if (!hasTokens) {
            setAuthError(
              "Invalid or expired reset link. Please request a new one."
            );
          }
        }
      } catch (err) {
        console.error("Error checking auth:", err);
      } finally {
        setLoadingCheck(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<ResetPasswordFormType>({
    resolver: zodResolver(getResetPasswordFormSchema()),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmitHandler = async (values: ResetPasswordFormType) => {
    const { password } = values;

    resetPassword({ password });
  };

  if (loadingCheck) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage className="text-destructive text-center">
          {authError}
        </FormMessage>
        <Button type="button" variant="secondary" asChild>
          <Link href="/login">← Back to Login</Link>
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center py-4 text-success">
          <p className="mb-4">
            Your password has been successfully reset. Redirecting to login...
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link href="/login">Go to Login →</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} noValidate>
        <div className="flex flex-col gap-4">
          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    id="password"
                    {...field}
                    placeholder="Enter new password (min. 6 characters)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="confirmPassword"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    id="confirmPassword"
                    {...field}
                    placeholder="Confirm new password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isError && (
            <FormMessage className="text-destructive text-center">
              Failed to reset password. Please try again.
            </FormMessage>
          )}
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? <Loader /> : "Reset Password"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            asChild
          >
            <Link href="/login">← Back to Login</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export const ResetPasswordForm = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ResetPasswordFormContent />
    </Suspense>
  );
};
