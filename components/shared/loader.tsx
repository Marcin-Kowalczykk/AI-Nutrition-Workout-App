import { LoaderCircleIcon } from "lucide-react";

interface LoaderProps {
  size?: 16 | 20 | 24 | 28 | 32 | 36 | 40 | 44 | 48;
}

export const Loader = ({ size = 48 }: LoaderProps) => {
  return (
    <LoaderCircleIcon
      className="animate-spin text-muted-foreground"
      size={size}
    />
  );
};
