"use client";

// components
import { Toaster } from "sonner";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/sidebar/app-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  return (
    <>
      <Toaster position="bottom-center" richColors />
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-h-dvh h-dvh max-md:min-h-[var(--vvh,100svh)] max-md:h-[var(--vvh,100svh)] w-full md:w-[calc(100%-var(--sidebar-width-expanded))] md:peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-collapsed))]">
          {isMobile ? (
            <header className="flex h-16 bg-sidebar-background border-b border-sidebar-border shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex justify-between items-center gap-2 px-4">
                <div className="-ml-1 flex items-center gap-2 cursor-pointer text-sidebar-foreground">
                  <SidebarTrigger />
                </div>
              </div>
            </header>
          ) : null}
          <div className="protected-layout-content flex flex-col gap-2 p-3 h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] max-md:h-[calc(var(--vvh,100svh)-4rem)] max-md:max-h-[calc(var(--vvh,100svh)-4rem)] overflow-y-auto overflow-x-hidden bg-color-background tracking-normal">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};

export default ProtectedLayout;
