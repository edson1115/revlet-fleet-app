"use client";

import { clsx } from "clsx";

export interface TeslaTimelineProps {
  status: string;
  created?: string | null;
  scheduled?: string | null;
  preferredStart?: string | null;
  preferredEnd?: string | null;
}

const STATUS_ORDER = [
  "NEW",
  "WAITING",
  "WAITING_FOR_APPROVAL",
  "WAITING_FOR_PARTS",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
];

export function TeslaTimeline({ 
  status, 
  created, 
  scheduled, 
  preferredStart, 
  preferredEnd 
}: TeslaTimelineProps) {
  
  // Normalize status to find index (handle potential mismatch)
  const safeStatus = STATUS_ORDER.includes(status) ? status : "NEW";
  const currentIndex = STATUS_ORDER.indexOf(safeStatus);

  const formatDate = (d?: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  return (
    <div className="w-full">
      {/* 1. VISUAL STEPPER */}
      <div className="px-2 py-6 relative">
        {/* Connecting line background */}
        <div className="absolute top-[35px] left-4 right-4 h-[2px] bg-gray-200 -z-10" />

        <div className="flex items-start justify-between relative z-0">
          {STATUS_ORDER.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isActive = index === currentIndex;
            const isFuture = index > currentIndex;

            // Only show labels for active, first, and last to save space on mobile
            const showLabel = isActive || index === 0 || index === STATUS_ORDER.length - 1;

            return (
              <div
                key={step}
                className="flex flex-col items-center flex-1"
              >
                {/* DOT */}
                <div
                  className={clsx(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-white z-10",
                    isActive && "border-black bg-black text-white scale-125",
                    isCompleted && !isActive && "border-green-500 bg-green-500 text-white",
                    isFuture && "border-gray-300 text-gray-300"
                  )}
                >
                  <span className="text-[9px] font-bold">
                    {index + 1}
                  </span>
                </div>

                {/* LINE SEGMENT (Colored) */}
                {index < STATUS_ORDER.length - 1 && index < currentIndex && (
                   <div className="absolute top-[11px] h-[2px] bg-green-500 -z-10" 
                        style={{ 
                            left: `calc(${(100 / (STATUS_ORDER.length - 1)) * index}% + 12px)`, 
                            width: `calc(${100 / (STATUS_ORDER.length - 1)}% - 0px)` 
                        }} 
                   />
                )}

                {/* LABEL */}
                <p
                  className={clsx(
                    "text-[8px] mt-2 font-medium uppercase tracking-wider text-center absolute top-8 w-20",
                    isActive ? "text-black font-bold" : "text-gray-400",
                    !showLabel && "hidden md:block" // Hide intermediate labels on small screens
                  )}
                >
                  {step.replace(/_/g, " ")}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. DATE DETAILS */}
      <div className="mt-6 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 grid grid-cols-2 gap-4 text-xs">
        {created && (
          <div>
            <div className="text-gray-500 font-medium">Requested</div>
            <div className="text-gray-900">{formatDate(created)}</div>
          </div>
        )}

        {(preferredStart || preferredEnd) && !scheduled && (
           <div>
            <div className="text-gray-500 font-medium">Preferred</div>
            <div className="text-gray-900">{formatDate(preferredStart)}</div>
          </div>
        )}

        {scheduled && (
          <div className="col-span-2 border-t border-gray-200 pt-2 mt-2">
            <div className="text-gray-500 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                Confirmed Schedule
            </div>
            <div className="text-sm font-bold text-gray-900 mt-1">
                {formatDate(scheduled)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}