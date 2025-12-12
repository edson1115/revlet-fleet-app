"use client";

import { useEffect } from "react";
import { TeslaTimeline } from "../TeslaTimeline";
import { TeslaStatusBadge } from "../TeslaStatusBadge";

export function RequestDrawer({ open, onClose, request }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  if (!open || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full sm:w-[420px] bg-white h-full shadow-xl p-6 overflow-y-auto animate-slideIn">

        <h2 className="text-xl font-semibold">{request.service_type}</h2>

        <div className="mt-2">
          <TeslaStatusBadge status={request.status} />
        </div>

        <TeslaTimeline status={request.status} />

        <section className="mt-6 space-y-2">
          <h3 className="font-semibold text-gray-900">Vehicle</h3>
          <p className="text-sm text-gray-600">
            {request.vehicle_year} {request.vehicle_make} {request.vehicle_model}
          </p>
          <p className="text-sm text-gray-600">
            Plate: {request.vehicle_plate}
          </p>
          <p className="text-sm text-gray-600">
            VIN: {request.vehicle_vin}
          </p>
        </section>

        <section className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-1">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {request.notes || "No notes added"}
          </p>
        </section>

        <button
          className="mt-8 w-full py-2 bg-gray-900 text-white rounded-xl"
          onClick={onClose}
        >
          Close
        </button>

      </div>
    </div>
  );
}
