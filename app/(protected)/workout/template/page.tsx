import { Suspense } from "react";
import { TemplateList } from "@/components/workout-template/template-list";
import { ViewTemplateSheet } from "@/components/workout-template/view-template-sheet";

export default function TemplatesPage() {
  return (
    <Suspense fallback={null}>
      <TemplateList />
      <ViewTemplateSheet />
    </Suspense>
  );
}
