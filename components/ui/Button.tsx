"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  full = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-xl font-medium transition-all duration-200 ease-in-out select-none",
        "focus:outline-none active:scale-[0.98]",
        full && "w-full",

        // Sizes
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-base",
        size === "lg" && "px-6 py-3 text-lg",

        // Variants
        variant === "primary" &&
          "bg-[#80FF44] text-[#0A0A0A] shadow-sm hover:bg-[#72F03E]",

        variant === "secondary" &&
          "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",

        variant === "danger" &&
          "bg-red-500 text-white shadow-sm hover:bg-red-600",

        variant === "ghost" &&
          "text-gray-500 hover:text-black hover:bg-gray-100",

        className
      )}
      {...props}
    />
  );
}
