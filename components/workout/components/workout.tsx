"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Loader } from "@/components/shared/loader";
import { WorkoutForm } from "./workout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Workout = () => {
  const pathname = usePathname();
  const isTemplate = pathname?.includes("create-template");
  const title = isTemplate ? "Create New Template" : "Create New Workout";

  return (
    <Suspense fallback={<Loader />}>
      <Card className="w-full xl:w-1/2">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutForm />
        </CardContent>
      </Card>
    </Suspense>
  );
};

export default Workout;
