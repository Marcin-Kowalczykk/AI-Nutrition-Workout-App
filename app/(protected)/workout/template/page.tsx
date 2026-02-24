import { Suspense } from "react";
import { TemplateList } from "@/components/workout-template/template-list";
import { ViewTemplateSheet } from "@/components/workout-template/view-template-sheet";
import { Loader } from "@/components/shared/loader";

export default function TemplatesPage() {
  return (
    <>
      <Suspense fallback={<Loader />}>
        <TemplateList />
      </Suspense>
      <Suspense fallback={null}>
        <ViewTemplateSheet />
      </Suspense>
    </>
  );
}
