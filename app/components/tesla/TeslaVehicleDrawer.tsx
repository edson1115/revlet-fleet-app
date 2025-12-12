"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function TeslaVehicleDrawer({
  open,
  vehicle,
  onClose,
}: {
  open: boolean;
  vehicle: any;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!vehicle) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Background Blur */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 h-full w-[420px] bg-white z-50 shadow-xl p-6 overflow-y-auto"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
          >
            <h2 className="text-xl font-semibold mb-4">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>

            <div className="space-y-2 text-gray-700">
              <div><strong>Unit:</strong> {vehicle.unit_number ?? "—"}</div>
              <div><strong>Plate:</strong> {vehicle.plate ?? "—"}</div>
              <div><strong>VIN:</strong> {vehicle.vin ?? "—"}</div>
              <div><strong>Mileage:</strong> {vehicle.mileage_text ?? "—"}</div>
            </div>

            <hr className="my-5" />

            {/* NEW REQUEST BUTTON */}
            <button
              onClick={() => {
                router.push(`/customer/new-request?vehicle_id=${vehicle.id}`);
              }}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
            >
              Create Service Request
            </button>

            {/* FUTURE AI BUTTON */}
            <button
              onClick={() => alert("AI Damage Scan Coming Soon")}
              className="w-full mt-3 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              AI Vehicle Scan
            </button>

            <button
              onClick={onClose}
              className="mt-6 text-center block w-full text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
