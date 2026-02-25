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
      <div className="flex min-h-0 flex-1 flex-col">
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <SidebarInset className="flex min-h-0 flex-1 flex-col w-full md:w-[calc(100%-var(--sidebar-width-expanded))] md:peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-collapsed))] md:min-h-svh md:h-svh">
            {isMobile ? (
              <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border bg-sidebar-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div className="flex items-center justify-between gap-2 px-4">
                  <div className="-ml-1 flex cursor-pointer items-center gap-2 text-sidebar-foreground">
                    <SidebarTrigger />
                  </div>
                </div>
              </header>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden bg-color-background p-3 tracking-normal">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </>
  );
};

export default ProtectedLayout;
