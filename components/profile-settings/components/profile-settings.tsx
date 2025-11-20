"use client";

// components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettingsForm } from "./profile-settings-form";

const ProfileSettings = () => {
  return (
    <Card className="w-full xl:w-1/2">
      <CardHeader>
        <CardTitle className="text-card-foreground text-2xl font-semibold tracking-normal">
          Profile Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileSettingsForm />
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
