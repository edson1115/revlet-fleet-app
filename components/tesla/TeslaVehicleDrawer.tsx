"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TeslaVehicleDrawer({
  open,
  vehicle,
  onClose,
}: {
  open: boolean;
  vehicle: any;
  onClose: () => void;
}) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingReq, setLoadingReq] = useState(false);

  useEffect(() => {
    if (!open || !vehicle?.id) return;

    async function loadReq() {
      setLoadingReq(true);
      try {
        const res = await fetch(`/api/customer/requests?vehicle_id=${vehicle.id}`, {
          cache: "no-store",
        });
        const js = await res.json();
        if (res.ok) {
          setRequests(js.requests?.slice(0, 5) || []);
        }
      } finally {
        setLoadingReq(false);
      }
    }

    loadReq();
  }, [open, vehicle?.id]);

  if (!open || !vehicle) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.25 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-end z-[500]"
    >
      <div className="w-full max-w-md h-full bg-white p-6 overflow-y-auto shadow-2xl">

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>

            <div className="text-sm mt-1 text-gray-600 space-y-1">
              <div><strong>Unit:</strong> {vehicle.unit_number || "—"}</div>
              <div><strong>Plate:</strong> {vehicle.plate || "—"}</div>
              <div><strong>VIN:</strong> {vehicle.vin || "—"}</div>
              <div>
                <strong>Mileage:</strong>{" "}
                {vehicle.mileage_override ??
                  vehicle.last_reported_mileage ??
                  "—"}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-10">
          <Link
            href={`/customer/update-mileage?vehicle_id=${vehicle.id}`}
            className="w-full bg-black text-white py-3 rounded-lg text-center font-medium hover:bg-gray-900"
          >
            Update Mileage
          </Link>

          <Link
            href={`/customer/requests/new?vehicle_id=${vehicle.id}`}
            className="w-full block text-center bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Create Service Request
          </Link>

          <button
            onClick={() => alert("AI Scan modal coming next step")}
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg text-center font-medium hover:bg-gray-300"
          >
            AI Vehicle Scan
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3">Recent Services</h3>

          {loadingReq && <div className="text-sm text-gray-500">Loading…</div>}

          {!loadingReq && requests.length === 0 && (
            <div className="text-sm text-gray-400">No service history.</div>
          )}

          <div className="space-y-3">
            {requests.map((r: any) => (
              <Link
                key={r.id}
                href={`/customer/requests/${r.id}`}
                className="block border rounded-lg p-3 hover:bg-gray-50 transition"
              >
                <div className="font-medium text-gray-800">
                  {r.service_type || "General Service"}
                </div>

                <div className="text-sm text-gray-500 flex justify-between mt-1">
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200">
                    {r.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
