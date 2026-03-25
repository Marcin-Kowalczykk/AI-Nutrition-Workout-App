"use client";

// components
import { Toaster } from "sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { TopBar } from "@/components/shared/top-bar";
import BackgroundImage from "@/components/shared/background-image";
import { WorkoutUnsavedProvider } from "@/components/workout-form/context/workout-unsaved-context";
import { ScrollJumpButton } from "@/components/shared/scroll-jump-button";
import { useRef } from "react";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  return (
    <>
      <Toaster position="bottom-center" richColors />
      <div className="flex min-h-0 flex-1 flex-col">
        <SidebarProvider defaultOpen={true}>
          <WorkoutUnsavedProvider>
            <AppSidebar />
            <SidebarInset className="flex min-h-0 flex-1 flex-col w-full md:w-[calc(100%-var(--sidebar-width-expanded))] md:peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-collapsed))] md:min-h-svh md:h-svh">
              {isMobile ? <TopBar /> : null}
              <div
                ref={scrollContainerRef}
                data-scroll-container
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden bg-color-background p-1.5 pb-0 tracking-normal"
              >
                {children}
                <div className="flex w-full justify-start pt-2 pb-1">
                  <BackgroundImage
                    imagePath="/images/auth-bg.jpeg"
                    className="w-full xl:w-1/2 flex-none min-h-80 md:min-h-96 lg:h-96 lg:flex-none"
                    fallbackClassName="bg-black"
                  />
                </div>
              </div>
              <ScrollJumpButton
                scrollContainerRef={
                  scrollContainerRef as React.RefObject<HTMLElement>
                }
              />
            </SidebarInset>
          </WorkoutUnsavedProvider>
        </SidebarProvider>
      </div>
    </>
  );
};

export default ProtectedLayout;
