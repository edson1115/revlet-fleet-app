"use client";

import clsx from "clsx";

export default function OfficeRequestRow({
  request,
  onClick,
}: {
  request: any;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full rounded-xl border bg-white px-4 py-3 text-left",
        "hover:bg-gray-50 transition"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold">
            {request.customer?.name ?? "Unknown Customer"}
          </div>

          <div className="text-xs text-gray-500">
            {request.vehicle?.unit_number
              ? `Unit ${request.vehicle.unit_number}`
              : request.vehicle?.plate
              ? `Plate ${request.vehicle.plate}`
              : "Vehicle"}
          </div>
        </div>

        <div className="text-xs font-semibold text-gray-700">
          {request.status}
        </div>
      </div>
    </button>
  );
}
