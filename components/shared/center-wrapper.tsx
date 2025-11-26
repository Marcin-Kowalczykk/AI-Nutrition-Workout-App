"use client";

import { cn } from "@/lib/utils";

interface CenterWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const CenterWrapper = ({ children, className }: CenterWrapperProps) => {
  return (
    <div
      className={cn(
        "flex justify-center items-center h-full w-full",
        className
      )}
    >
      {children}
    </div>
  );
};

export default CenterWrapper;
