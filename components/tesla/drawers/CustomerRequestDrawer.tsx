"use client";

export function CustomerRequestDrawer({ open, request, onClose }: any) {
  if (!open || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose}></div>

      <div className="w-full sm:w-[480px] bg-white h-full p-6 overflow-y-auto animate-slideIn">
        <h2 className="text-xl font-semibold text-gray-900">
          {request.service_type}
        </h2>

        <p className="text-sm text-gray-600 mt-1">
          {request.vehicle_year} {request.vehicle_make} {request.vehicle_model}  
          ({request.vehicle_plate})
        </p>

        {/* TIMELINE */}
        <section className="mt-6">
          <h3 className="font-semibold mb-3">Job Status</h3>
          <ul className="space-y-2">
            <li className={`text-sm ${request.status === "NEW" ? "font-bold text-blue-600" : "text-gray-500"}`}>
              NEW — Request Submitted
            </li>

            <li className={`text-sm ${request.status === "WAITING" ? "font-bold text-blue-600" : "text-gray-500"}`}>
              WAITING — Pending Office
            </li>

            <li className={`text-sm ${request.status === "SCHEDULED" ? "font-bold text-blue-600" : "text-gray-500"}`}>
              SCHEDULED — Dispatch Assigned
            </li>

            <li className={`text-sm ${request.status === "IN_PROGRESS" ? "font-bold text-blue-600" : "text-gray-500"}`}>
              IN PROGRESS — Technician Working
            </li>

            <li className={`text-sm ${request.status === "COMPLETED" ? "font-bold text-blue-600" : "text-gray-500"}`}>
              COMPLETED — Done
            </li>
          </ul>
        </section>

        {/* NOTES */}
        {request.notes && (
          <section className="mt-6">
            <h3 className="font-semibold">Notes</h3>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
              {request.notes}
            </p>
          </section>
        )}

        <button
          className="mt-6 w-full py-2 bg-gray-100 rounded-xl text-gray-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
