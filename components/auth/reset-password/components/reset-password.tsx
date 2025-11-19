"use client";

// components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

const ResetPassword = () => {
  return (
    <div className="sm:col-span-4 sm:col-start-1 md:col-span-6 md:col-start-2 xl:col-span-4 xl:col-start-5">
      <h1 className="text-[24px] md:text-[36px] lg:text-[36px] mb-8 font-bold text-center text-foreground">
        Workout & Diet Tracker
      </h1>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-card-foreground text-2xl font-semibold tracking-normal text-center">
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
