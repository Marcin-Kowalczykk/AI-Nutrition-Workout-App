"use client";

// hooks
import { useState } from "react";

// components
import { Input } from "@/components/ui/input";

// utils
import { cn } from "@/lib/utils";

// icons
import { EyeIcon, EyeOff } from "lucide-react";

type PasswordInputProps = {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
};
export const PasswordInput = ({
  value,
  onChange,
  placeholder,
  className = "",
  id,
  ...props
}: PasswordInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const typeToggle = () => setIsPasswordVisible((prev) => !prev);
  return (
    <div className="relative">
      <Input
        id={id}
        type={isPasswordVisible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder || "Wpisz"}
        autoComplete="current-password"
        className={cn(className, "bg-background")}
        {...props}
      />
      <button
        onClick={typeToggle}
        type="button"
        aria-label="Toggle password visibility"
        className="absolute top-1.5 right-3 text-primary-foreground"
      >
        {isPasswordVisible ? <EyeIcon size={25} /> : <EyeOff size={25} />}
      </button>
    </div>
  );
};
