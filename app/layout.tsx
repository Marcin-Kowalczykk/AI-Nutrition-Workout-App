import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ThemeInitializer from "@/components/providers/theme-initializer";
import { IosViewportListener } from "@/components/shared/ios-viewport";
import { ServiceWorkerRegister } from "@/components/service-worker/service-worker-register";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "AI Nutrition & Workout App",
  description:
    "AI-powered app for tracking nutrition, counting calories and monitoring your workout progress",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Nutrition & Workout",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full min-h-full overflow-x-hidden">
        <ServiceWorkerRegister />
        <IosViewportListener />
        <div className="flex h-full min-h-full flex-col">
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
