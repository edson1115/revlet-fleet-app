"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import StatusChip from "@/components/ui/StatusChip";

interface TeslaListItemProps {
  title: string;
  subtitle?: string;
  metadata?: string;
  status?: string;
  onClick?: () => void;
  href?: string;
  rightIcon?: boolean;
  className?: string;
}

export default function TeslaListItem({
  title,
  subtitle,
  metadata,
  status,
  onClick,
  href,
  rightIcon = true,
  className,
}: TeslaListItemProps) {
  const Component = href ? "a" : "div";

  return (
    <Component
      onClick={onClick}
      href={href}
      className={cn(
        "flex items-center justify-between w-full px-4 py-3 rounded-xl",
        "bg-white hover:bg-[#F7F7F7] transition-all duration-150",
        "cursor-pointer select-none shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-[2px]">
        <div className="text-[15px] font-medium text-[#0A0A0A]">{title}</div>

        {subtitle && (
          <div className="text-[13px] text-[#7A7A7A]">{subtitle}</div>
        )}

        {metadata && (
          <div className="text-[12px] text-[#A0A0A0]">{metadata}</div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {status && <StatusChip status={status} />}

        {rightIcon && (
          <ChevronRight
            size={18}
            className="text-gray-400 group-hover:text-gray-600 transition"
          />
        )}
      </div>
    </Component>
  );
}



