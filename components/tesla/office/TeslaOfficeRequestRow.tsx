"use client";

import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

export function TeslaOfficeRequestRow({
  req,
  onClick,
}: {
  req: any;
  onClick: () => void;
}) {
  // Support either flattened fields or nested vehicle
  const year = req.vehicle_year ?? req?.vehicle?.year ?? "";
  const make = req.vehicle_make ?? req?.vehicle?.make ?? "";
  const model = req.vehicle_model ?? req?.vehicle?.model ?? "";
  const plate = req.vehicle_plate ?? req?.vehicle?.plate ?? "";
  const type = req.service_type ?? req.type ?? "Service Request";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer px-4 py-3 hover:bg-gray-50 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 truncate">{type}</h3>
            <TeslaStatusBadge status={req.status ?? "NEW"} />
          </div>
          <p className="text-sm text-gray-500 mt-1 truncate">
            {year} {make} {model} {plate && `— ${plate}`}
          </p>
          {req.customer_name && (
            <p className="text-xs text-gray-400 mt-0.5">
              Customer: {req.customer_name}
            </p>
          )}
        </div>

        <div className="text-right text-xs text-gray-400">
          {req.created_at ? new Date(req.created_at).toLocaleString() : ""}
        </div>
      </div>
    </div>
  );
}
