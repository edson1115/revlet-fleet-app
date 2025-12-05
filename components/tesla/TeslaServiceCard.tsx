"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeslaServiceCard({
  title,
  icon: Icon,
  children,
  badge,
  footer,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full bg-white rounded-xl shadow-sm p-6 mb-6",
        "border border-transparent transition-all",
        "hover:shadow-md",
        className
      )}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-gray-500" />}
          <h2 className="text-[20px] font-medium text-black tracking-tight">
            {title}
          </h2>
        </div>

        {badge && (
          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            {badge}
          </span>
        )}
      </div>

      {/* BODY */}
      <div className="space-y-3">{children}</div>

      {/* FOOTER (optional) */}
      {footer && <div className="mt-6 border-t pt-4">{footer}</div>}
    </div>
  );
}



