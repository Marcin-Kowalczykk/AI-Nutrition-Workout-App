"use client";

import { useParams } from "next/navigation";
import Workout from "@/components/workout-form/components/workout";

export default function EditTemplatePage() {
  const params = useParams();
  const templateId = typeof params?.id === "string" ? params.id : null;

  return <Workout isTemplateMode templateId={templateId} />;
}
