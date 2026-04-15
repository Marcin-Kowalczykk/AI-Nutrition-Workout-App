"use client";

// libs
import { useRef, useState, useCallback, Suspense } from "react";

// components
import { Toaster } from "sonner";
import { RouteRestorer } from "@/components/shared/route-restorer/route-restorer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";
import { TopBar } from "@/components/shared/top-bar";
import BackgroundImage from "@/components/shared/background-image";
import { WorkoutUnsavedProvider } from "@/components/workout-form/context/workout-unsaved-context";
import { ScrollJumpButton } from "@/components/shared/scroll-jump-button";
import { FloatingSidebarButton } from "@/components/shared/floating-sidebar-button";
import { RightDrawer } from "@/components/shared/right-drawer/right-drawer";

// hooks
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeFromRightEdge } from "@/hooks/use-swipe-from-right-edge";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  const openRightDrawer = useCallback(() => setRightDrawerOpen(true), []);
  useSwipeFromRightEdge(openRightDrawer);

  return (
    <>
      <Suspense fallback={null}>
        <RouteRestorer />
      </Suspense>
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
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-y-none bg-color-background p-1.5 pb-0 tracking-normal"
              >
                {children}
                <div className="flex w-full justify-start pt-2">
                  <BackgroundImage
                    imagePath="/images/auth-bg.jpeg"
                    className="w-full xl:w-1/2 flex-none min-h-95 md:min-h-96 lg:h-96 lg:flex-none"
                    fallbackClassName="bg-color-background"
                  />
                </div>
              </div>
              <FloatingSidebarButton />
              <ScrollJumpButton
                scrollContainerRef={
                  scrollContainerRef as React.RefObject<HTMLElement>
                }
              />
            </SidebarInset>
            <RightDrawer
              open={rightDrawerOpen}
              onClose={() => setRightDrawerOpen(false)}
            />
          </WorkoutUnsavedProvider>
        </SidebarProvider>
      </div>
    </>
  );
};

export default ProtectedLayout;
