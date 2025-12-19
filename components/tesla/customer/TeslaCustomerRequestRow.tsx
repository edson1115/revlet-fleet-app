"use client";

import { Wrench, CircleDollarSign } from "lucide-react";
import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

/* ---------------------------------------------------------
   ICON
--------------------------------------------------------- */
function getIcon(type?: string) {
  switch (type) {
    case "TIRE_PURCHASE":
      return <CircleDollarSign size={18} />;
    default:
      return <Wrench size={18} />;
  }
}

/* ---------------------------------------------------------
   TITLE RESOLUTION (OFFICE WINS)
   1. service_title
   2. service
   3. type
--------------------------------------------------------- */
function getTitle(req: any) {
  if (req.type === "TIRE_PURCHASE") return "Tire Purchase";

  return (
    req.service_title ||
    req.service ||
    req.type ||
    "Service Request"
  );
}

export function TeslaCustomerRequestRow({ req }: any) {
  const vehicle = req.vehicle;

  return (
    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        {/* LEFT */}
        <div className="space-y-1">
          <p className="font-semibold text-gray-900 flex items-center gap-3">
            {getIcon(req.type)}
            {getTitle(req)}
            <TeslaStatusBadge status={req.status} />

            {req.service_title && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                Updated by Office
              </span>
            )}
          </p>

          {req.service_description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {req.service_description}
            </p>
          )}

          {vehicle && (
            <p className="text-sm text-gray-500">
              {vehicle.year} {vehicle.make} {vehicle.model}
              {vehicle.plate ? ` — ${vehicle.plate}` : ""}
            </p>
          )}

          {!vehicle && req.type === "TIRE_PURCHASE" && (
            <p className="text-sm text-gray-500">
              Tire Order • No vehicle assigned
            </p>
          )}
        </div>

        {/* RIGHT */}
        <p className="text-xs text-gray-400 whitespace-nowrap">
          {new Date(req.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
