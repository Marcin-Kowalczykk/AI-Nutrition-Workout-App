"use client";

// components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettingsForm } from "./profile-settings-form";

const ProfileSettings = () => {
  return (
    <Card className="w-full xl:w-1/2">
      <CardContent>
        <ProfileSettingsForm />
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
