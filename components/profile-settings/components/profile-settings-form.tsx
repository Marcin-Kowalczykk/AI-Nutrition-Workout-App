"use client";

// dependencies
import { Suspense, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

// hooks
import { useForm, useWatch } from "react-hook-form";
import { useUpdateProfile } from "../api/use-update-profile";
import { useGetProfile } from "../../../hooks/use-get-profile";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Theme } from "@/components/shared/theme-toggle/theme-toggle";

// types and schemas
import {
  ProfileSettingsFormType,
  getProfileSettingsFormSchema,
} from "../types";

const ProfileSettingsFormContent = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profileData, isLoading, error: profileError } = useGetProfile();
  const {
    mutate: updateProfile,
    isPending,
    isError,
    error,
  } = useUpdateProfile({
    onSuccess: (message) => {
      queryClient.refetchQueries({ queryKey: ["get-profile"] });
      toast.success(message);
      form.setValue("password", "");
      form.setValue("confirmPassword", "");
    },
    onError: (error) => {
      toast.error(error || "Failed to update profile. Please try again.");
    },
  });
  const { setTheme } = useTheme();

  const form = useForm<ProfileSettingsFormType>({
    resolver: zodResolver(getProfileSettingsFormSchema()),
    defaultValues: {
      fullName: "",
      password: "",
      confirmPassword: "",
      theme: Theme.Dark,
    },
  });

  useEffect(() => {
    if (profileData) {
      form.reset({
        fullName: profileData.profile.full_name,
        password: "",
        confirmPassword: "",
        theme: profileData.profile.theme,
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
  const currentTheme = useWatch({ control: form.control, name: "theme" });

  const onSubmitHandler = async (values: ProfileSettingsFormType) => {
    const { fullName, password, theme } = values;

    updateProfile({
      fullName,
      password: password || undefined,
      theme: theme || undefined,
    });
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
  const initialTheme = profileData.profile.theme;
  const isFormDirty =
    currentFullName !== initialFullName ||
    currentTheme !== initialTheme ||
    (password && password.length > 0);
  const isNameOrThemeDirty =
    currentFullName !== initialFullName || currentTheme !== initialTheme;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} noValidate>
        <div className="flex flex-col gap-4">
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

          <FormField
            name="theme"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theme</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setTheme(value);
                    }}
                    disabled={isPending}
                  >
                    <div className="flex items-center space-x-2 py-2 w-full">
                      <RadioGroupItem value={Theme.Light} id={Theme.Light} />
                      <Label
                        htmlFor={Theme.Light}
                        className={
                          isPending ? "cursor-default" : "cursor-pointer"
                        }
                      >
                        Light Mode
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 w-full">
                      <RadioGroupItem value={Theme.Dark} id={Theme.Dark} />
                      <Label
                        htmlFor={Theme.Dark}
                        className={
                          isPending ? "cursor-default" : "cursor-pointer"
                        }
                      >
                        Dark Mode
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                {isNameOrThemeDirty && (
                  <FormDescription className="text-warning">
                    For saving changes in name or theme, click the &quot;Update
                    Profile&quot;
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          <div className="border-t pt-2 mt-2">
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
                      className="text-sm"
                      placeholder="Leave empty to keep current password"
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
                        className="text-sm"
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
            <FormMessage className="text-primary-element text-center">
              {error?.message || "Failed to update profile. Please try again."}
            </FormMessage>
          )}

          <Button
            type="submit"
            variant="default"
            disabled={isPending || !isFormDirty}
          >
            {isPending ? <Loader /> : "Update Profile"}
          </Button>

          <Button type="button" variant="outline" asChild>
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
