"use client";

import { useRouter } from "next/navigation";
import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

export function TeslaOfficeRequestRow({
  req,
}: {
  req: any;
}) {
  const router = useRouter();

  // Support either flattened fields or nested vehicle
  const year = req.vehicle_year ?? req?.vehicle?.year ?? "";
  const make = req.vehicle_make ?? req?.vehicle?.make ?? "";
  const model = req.vehicle_model ?? req?.vehicle?.model ?? "";
  const plate = req.vehicle_plate ?? req?.vehicle?.plate ?? "";
  const type = req.service_type ?? req.type ?? "Service Request";

  const customerName =
    req.customer_name ??
    req?.customer?.name ??
    null;

  function handleClick() {
    if (!req?.id) return;
    router.push(`/office/requests/${req.id}`);
  }

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer px-4 py-3 hover:bg-gray-50 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 truncate">
              {type}
            </h3>
            <TeslaStatusBadge status={req.status ?? "NEW"} />
          </div>

          <p className="text-sm text-gray-500 mt-1 truncate">
            {year} {make} {model} {plate && `— ${plate}`}
          </p>

          {customerName && (
            <p className="text-xs text-gray-400 mt-0.5">
              Customer: {customerName}
            </p>
          )}
        </div>

        <div className="text-right text-xs text-gray-400 whitespace-nowrap">
          {req.created_at
            ? new Date(req.created_at).toLocaleString()
            : ""}
        </div>
      </div>
    </div>
  );
}
