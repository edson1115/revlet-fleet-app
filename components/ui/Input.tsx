"use client";

import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-[13px] font-medium text-[#0A0A0A]">
          {label}
        </label>
      )}

      <input
        {...props}
        className={cn(
          "w-full h-[44px] px-4 rounded-[12px] bg-[#F5F5F5] text-[#0A0A0A] text-[15px]",
          "placeholder:text-[#A3A3A3] outline-none",
          "transition-all duration-200 ease-in-out",
          "focus:bg-white focus:ring-2 focus:ring-[#80FF44] focus:shadow-md",
          error && "ring-2 ring-[#FF3B30] bg-white",
          className
        )}
      />

      {error && (
        <p className="text-[12px] text-[#FF3B30] font-medium">{error}</p>
      )}
    </div>
  );
}
