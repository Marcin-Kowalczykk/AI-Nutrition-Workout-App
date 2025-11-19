import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

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
    <html lang="en">
      <body className="overflow-hidden">
        <TooltipProvider delayDuration={0}>
          <QueryProvider>{children}</QueryProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
