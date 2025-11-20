"use client";

import { cn } from "@/lib/utils";

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-[13px] font-medium text-[#0A0A0A]">
          {label}
        </label>
      )}

      <select
        {...props}
        className={cn(
          "w-full h-[44px] px-4 rounded-[12px] bg-[#F5F5F5] text-[#0A0A0A] text-[15px]",
          "appearance-none outline-none",
          "transition-all duration-200 ease-in-out",
          "focus:bg-white focus:ring-2 focus:ring-[#80FF44]",
          error && "ring-2 ring-[#FF3B30] bg-white",
          className
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-[12px] text-[#FF3B30] font-medium">{error}</p>
      )}
    </div>
  );
}
