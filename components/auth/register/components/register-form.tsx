"use client";

// dependencies
import { Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

// hooks
import { useForm } from "react-hook-form";
import { useRegister } from "../api/use-register";

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
import { Loader } from "@/components/shared/loader";

// types and schemas
import { RegisterFormType, getRegisterFormSchema } from "../types";

const RegisterFormContent = () => {
  const { mutate: register, isPending, isError } = useRegister();

  const form = useForm<RegisterFormType>({
    resolver: zodResolver(getRegisterFormSchema()),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmitHandler = async (values: RegisterFormType) => {
    const { email, password, fullName } = values;

    register({ email, password, fullName });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} noValidate>
        <div className="flex flex-col gap-4">
          <FormField
            name="fullName"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Full Name"
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    id="password"
                    {...field}
                    placeholder="Enter password (min. 6 characters)"
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
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    id="confirmPassword"
                    {...field}
                    placeholder="Confirm password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isError && (
            <FormMessage className="text-primary-element text-center">
              Registration failed. Please check your information and try again.
            </FormMessage>
          )}
          <Button type="submit" variant="default" disabled={isPending}>
            {isPending ? <Loader /> : "Register"}
          </Button>
          <Button type="button" variant="outline" disabled={isPending} asChild>
            <Link href="/login">Already have an account? Login</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export const RegisterForm = () => {
  return (
    <Suspense fallback={<Loader />}>
      <RegisterFormContent />
    </Suspense>
  );
};
