import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export const CreateTemplateRedirectButton = ({
  className,
}: {
  className?: string;
}) => (
  <Button
    asChild
    variant="outline"
    size="icon"
    className={cn("h-9 w-9 text-foreground", className)}
    aria-label="Create new template"
  >
    <Link href="/workout/template/create">
      <Plus className="h-4 w-4" />
    </Link>
  </Button>
);
