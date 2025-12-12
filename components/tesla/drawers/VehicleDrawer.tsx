"use client";

import { useEffect } from "react";

export function VehicleDrawer({ open, onClose, vehicle }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  if (!open || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="w-full sm:w-[420px] bg-white h-full shadow-xl p-6 overflow-y-auto animate-slideIn"
      >
        <h2 className="text-xl font-semibold mb-2">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          {vehicle.plate ? `Plate: ${vehicle.plate}` : "No plate on file"}
        </p>

        <div className="space-y-4">

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">Vehicle Info</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><b>VIN:</b> {vehicle.vin}</p>
              <p><b>Vendor:</b> {vehicle.vendor_id || "N/A"}</p>
              <p><b>Mileage:</b> {vehicle.mileage || "N/A"}</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">Status</h3>
            <div className="text-sm text-gray-700">
              Last updated: <b>{vehicle.updated_at}</b>
            </div>
          </section>

        </div>

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
