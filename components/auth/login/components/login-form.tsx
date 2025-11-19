"use client";
import { Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";

// hooks
import { useLogin } from "../api/use-login";

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
import { PasswordInput } from "@/components/shared/password-input";

// types and schemas
import { LoginFormType, getLoginFormSchema } from "../types";
import { Loader } from "@/components/shared/loader";

const LoginFormContent = () => {
  const { mutate: login, isPending, isError } = useLogin();

  const form = useForm<LoginFormType>({
    resolver: zodResolver(getLoginFormSchema()),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmitHandler = async (values: LoginFormType) => {
    const { email, password } = values;

    login({ email, password });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} noValidate>
        <div className="flex flex-col gap-4">
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
          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-muted-foreground text-sm underline hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    id="password"
                    {...field}
                    placeholder="Enter password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isError && (
            <FormMessage className="text-destructive text-center">
              Invalid login credentials. Check your credentials and make sure
              you are not using CAPS LOCK.
            </FormMessage>
          )}
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? <Loader /> : "Login"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            asChild
          >
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export const LoginForm = () => {
  return (
    <Suspense fallback={<Loader />}>
      <LoginFormContent />
    </Suspense>
  );
};
