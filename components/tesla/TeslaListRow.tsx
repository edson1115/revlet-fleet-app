"use client";

import clsx from "clsx";
import { TeslaStatusChip } from "./TeslaStatusChip";

export type TeslaListRowProps = {
  title: string;                         // top line
  subtitle?: string | null;              // second line
  metaLeft?: string | null;              // small text under subtitle (optional)
  status?: string | null;                // right-side chip
  rightIcon?: boolean;                   // show → arrow
  onClick?: () => void;                  // row click handler
  children?: React.ReactNode;            // optional custom content area
  className?: string;
};

export function TeslaListRow({
  title,
  subtitle,
  metaLeft,
  status,
  rightIcon = true,
  onClick,
  children,
  className,
}: TeslaListRowProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between px-4 py-4 border-b border-gray-100",
        "hover:bg-[#F5F5F5] transition cursor-pointer",
        className
      )}
    >
      {/* LEFT SIDE */}
      <div className="flex flex-col">
        <span className="text-[15px] font-medium text-black">
          {title}
        </span>

        {subtitle && (
          <span className="text-[13px] text-gray-700 mt-0.5">
            {subtitle}
          </span>
        )}

        {metaLeft && (
          <span className="text-[11px] text-gray-500 mt-1 tracking-tight">
            {metaLeft}
          </span>
        )}

        {children}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-2">
        {status && <TeslaStatusChip status={status} />}

        {rightIcon && (
          <span className="text-gray-400 text-base">→</span>
        )}
      </div>
    </div>
  );
}



