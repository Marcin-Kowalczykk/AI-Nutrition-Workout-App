import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gray-300 opacity-5",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
