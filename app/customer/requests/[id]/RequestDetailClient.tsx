"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

const STATUS_FLOW = [
  "NEW",
  "WAITING",
  "WAITING_FOR_APPROVAL",
  "WAITING_FOR_PARTS",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
];

export default function RequestDetailClient({ params }: any) {
  const router = useRouter();
  const { id } = params;
  const shortId = id?.slice(0, 8)?.toUpperCase();


  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);

  /* --------------------------------------------------------
     Load Request
  -------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customer/requests/${id}`, {
          credentials: "include",
        });
        const js = await res.json();
        if (js.ok) setRequest(js.request);
      } catch (err) {
        console.error("Request load error:", err);
      }
      setLoading(false);
    })();
  }, [id]);

  /* --------------------------------------------------------
     Delete Request (NEW only)
  -------------------------------------------------------- */
  async function deleteRequest() {
    if (!request || request.status !== "NEW") return;

    if (!confirm("Delete this request? This cannot be undone.")) return;

    const res = await fetch(`/api/customer/requests/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      alert("Failed to delete request");
      return;
    }

    router.push("/customer/requests");
  }

  if (loading || !request) {
    return <div className="p-6 text-gray-500">Loading request…</div>;
  }

  const isTirePurchase = request.type === "TIRE_PURCHASE";
  const currentIndex = STATUS_FLOW.indexOf(request.status);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold">
            {isTirePurchase
              ? `Tire Purchase #${shortId}`
              : `Service Request #${shortId}`}
          </h1>
          <div className="mt-2">
            <TeslaStatusChip status={request.status} />
          </div>
        </div>

        {request.status === "NEW" && (
          <button
            onClick={deleteRequest}
            className="text-red-600 text-sm font-medium hover:underline"
          >
            Delete Request
          </button>
        )}
      </div>

      {/* TESLA-STYLE STATUS TIMELINE */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {STATUS_FLOW.map((s, i) => {
            const active = i <= currentIndex;
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={clsx(
                    "h-3 w-3 rounded-full",
                    active ? "bg-black" : "bg-gray-300"
                  )}
                />
                {i < STATUS_FLOW.length - 1 && (
                  <div
                    className={clsx(
                      "h-[2px] w-8",
                      active ? "bg-black" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-sm text-gray-500">
          Status: {request.status.replaceAll("_", " ")}
        </p>
      </div>

      {/* ============================
          TIRE PURCHASE LAYOUT
         ============================ */}
      {isTirePurchase && (
        <>
          <TeslaSection label="Tire Order">
            <div className="text-sm space-y-1">
              <div>
                <strong>Tire Size:</strong> {request.tire_size || "—"}
              </div>
              <div>
                <strong>Quantity:</strong> {request.tire_quantity || "—"}
              </div>
              <div>
                <strong>PO Number:</strong> {request.po || "—"}
              </div>
              <div>
                <strong>Delivery Location:</strong>{" "}
                {request.dropoff_address || "—"}
              </div>
            </div>
          </TeslaSection>

          {request.notes && (
            <TeslaSection label="Notes">
              <p className="text-sm text-gray-700">{request.notes}</p>
            </TeslaSection>
          )}
        </>
      )}

      {/* ============================
          VEHICLE SERVICE LAYOUT
         ============================ */}
      {!isTirePurchase && request.vehicle && (
        <>
          <TeslaSection label="Vehicle">
            <div className="text-sm space-y-1">
              <div>
                {request.vehicle.year} {request.vehicle.make}{" "}
                {request.vehicle.model}
              </div>
              <div className="text-gray-600">
                Plate {request.vehicle.plate} • Unit{" "}
                {request.vehicle.unit_number || "—"}
              </div>
            </div>
          </TeslaSection>

          <TeslaSection label="Mileage">
            <div className="text-sm">{request.mileage || "—"}</div>
          </TeslaSection>

          {request.notes && (
            <TeslaSection label="Notes">
              <p className="text-sm text-gray-700">{request.notes}</p>
            </TeslaSection>
          )}
        </>
      )}

      {/* BACK */}
      <button
        onClick={() => router.push("/customer/requests")}
        className="text-sm text-gray-600 hover:underline"
      >
        ← Back to Requests
      </button>
    </div>
  );
}
