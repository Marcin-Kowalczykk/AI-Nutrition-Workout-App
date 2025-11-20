"use client";

// components
import Link from "next/link";
import { Loader } from "../shared/loader";

// hooks
import { useGetProfile } from "@/hooks/use-get-profile";

const MainPage = () => {
  const { data, isLoading, error, isError } = useGetProfile();

  const { profile, user } = data || {};

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  return (
    <div className=" flex flex-col gap-4 max-w-screen-2xl pb-10 text-secondary-foreground bg-background h-full w-full rounded-lg p-4">
      <h1 className="text-2xl font-bold mb-4 text-secondary-foreground">
        name: {profile?.full_name}
      </h1>
      <h1 className="text-2xl font-bold mb-4 text-secondary-foreground">
        email: {user?.email}
      </h1>

      <div className="mt-8 flex gap-4">
        <Link
          href="/profile-settings"
          className="px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer hover:bg-primary/90 transition-colors"
        >
          Profile Settings
        </Link>
      </div>
    </div>
  );
};

export default MainPage;
