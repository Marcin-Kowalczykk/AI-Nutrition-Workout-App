"use client";

// dependencies
import { Suspense, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

// hooks
import { useForm, useWatch } from "react-hook-form";
import { useUpdateProfile } from "../api/use-update-profile";
import { useProfile } from "../api/use-profile";

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
import { PasswordInput } from "@/components/shared/password-input";
import { Loader } from "@/components/shared/loader";
import { toast } from "sonner";

// types and schemas
import {
  ProfileSettingsFormType,
  getProfileSettingsFormSchema,
} from "../types";

const ProfileSettingsFormContent = () => {
  const router = useRouter();
  const { data: profileData, isLoading, error: profileError } = useProfile();
  const { mutate: updateProfile, isPending, isError } = useUpdateProfile();

  const form = useForm<ProfileSettingsFormType>({
    resolver: zodResolver(getProfileSettingsFormSchema()),
    defaultValues: {
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (profileData) {
      form.reset({
        fullName: profileData.profile.full_name,
        password: "",
        confirmPassword: "",
      });
    }
  }, [profileData, form]);

  useEffect(() => {
    if (profileError) {
      router.push("/login");
    }
  }, [profileError, router]);

  const currentFullName = useWatch({ control: form.control, name: "fullName" });
  const password = useWatch({ control: form.control, name: "password" });

  const onSubmitHandler = async (values: ProfileSettingsFormType) => {
    const { fullName, password } = values;

    updateProfile(
      {
        fullName,
        password: password || undefined,
      },
      {
        onSuccess: () => {
          form.setValue("password", "");
          form.setValue("confirmPassword", "");
          toast.success("Profile updated successfully");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader />
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  const initialFullName = profileData.profile.full_name;
  const isFormDirty =
    currentFullName !== initialFullName || (password && password.length > 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} noValidate>
        <div className="flex flex-col gap-4">
          {/* Email (read-only) */}
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="text"
                value={profileData.user.email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </FormControl>
            <FormDescription>Email cannot be changed</FormDescription>
          </FormItem>

          {/* Full Name */}
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
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Section */}
          <div className="border-t pt-4 mt-2">
            <h3 className="text-lg font-semibold mb-3">Change Password</h3>

            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      id="newPassword"
                      {...field}
                      value={field.value || ""}
                      placeholder="Leave empty to keep current"
                    />
                  </FormControl>
                  <FormDescription>Minimum 6 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {password && (
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
                        value={field.value || ""}
                        placeholder="Confirm new password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {isError && (
            <FormMessage className="text-destructive text-center">
              Failed to update profile. Please try again.
            </FormMessage>
          )}

          <Button
            type="submit"
            variant="destructive"
            disabled={isPending || !isFormDirty}
          >
            {isPending ? <Loader /> : "Update Profile"}
          </Button>

          <Button type="button" variant="secondary" asChild>
            <Link href="/main-page">← Back to Main Page</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export const ProfileSettingsForm = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ProfileSettingsFormContent />
    </Suspense>
  );
};
