import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ThemeInitializer from "@/components/providers/theme-initializer";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Training Diet App",
  description:
    "Training Diet App for counting calories and tracking your diet and training progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full min-h-full overflow-x-hidden">
        <div className="layout-root flex h-full min-h-full flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={0}>
              <QueryProvider>
                <div className="flex min-h-0 flex-1 flex-col">
                  <ThemeInitializer />
                  {children}
                </div>
              </QueryProvider>
            </TooltipProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
