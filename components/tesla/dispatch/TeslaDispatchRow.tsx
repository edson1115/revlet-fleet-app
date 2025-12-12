"use client";

import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

export function TeslaDispatchRow({
  req,
  onClick,
}: {
  req: any;
  onClick: () => void;
}) {
  const year = req.vehicle_year ?? req?.vehicle?.year ?? "";
  const make = req.vehicle_make ?? req?.vehicle?.make ?? "";
  const model = req.vehicle_model ?? req?.vehicle?.model ?? "";
  const plate = req.vehicle_plate ?? req?.vehicle?.plate ?? "";
  const type = req.service_type ?? req.type ?? "Service Request";

  return (
    <div
      className="cursor-pointer px-4 py-3 hover:bg-gray-50 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-3">
            {type}
            <TeslaStatusBadge status={req.status ?? "WAITING"} />
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            {year} {make} {model} {plate && `— ${plate}`}
          </p>

          {req.customer_name && (
            <p className="text-xs text-gray-400">Customer: {req.customer_name}</p>
          )}
        </div>

        <div className="text-right text-xs text-gray-400">
          {req.created_at ? new Date(req.created_at).toLocaleString() : ""}
        </div>
      </div>
    </div>
  );
}
