"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";

import TeslaSection from "@/components/tesla/TeslaSection";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

const STATUS_FLOW = [
  "NEW",
  "WAITING",
  "TO_BE_SCHEDULED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
];

export default function OfficeRequestDetailClient() {
  const { id } = useParams<{ id: string }>();

  const [request, setRequest] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ---------------------------------------------
     LOAD REQUEST + USER ROLE
  --------------------------------------------- */
  async function load() {
    setLoading(true);

    const [reqRes, meRes] = await Promise.all([
      fetch(`/api/office/requests/${id}`, { cache: "no-store" }),
      fetch(`/api/auth/me`, { cache: "no-store" }),
    ]);

    const reqJson = await reqRes.json();
    const meJson = await meRes.json();

    if (reqJson.ok) setRequest(reqJson.request);
    if (meJson.ok) setRole(meJson.role);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  /* ---------------------------------------------
     STATUS UPDATE
  --------------------------------------------- */
  async function updateStatus(nextStatus: string) {
    if (!request || saving) return;

    setSaving(true);

    const res = await fetch(
      `/api/office/requests/${request.id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      }
    );

    const js = await res.json();
    setSaving(false);

    if (!res.ok) {
      alert(js.error || "Failed to update status");
      return;
    }

    setRequest({ ...request, status: nextStatus });
  }

  if (loading || !request) {
    return <div className="p-6 text-gray-500">Loading request…</div>;
  }

  const currentIndex = STATUS_FLOW.indexOf(request.status);

  /* ---------------------------------------------
     ROLE RULES
  --------------------------------------------- */
  function canClick(status: string, index: number) {
    if (saving) return false;
    if (index !== currentIndex + 1) return false;

    if (role === "DISPATCH") {
      return (
        request.status === "TO_BE_SCHEDULED" &&
        status === "SCHEDULED"
      );
    }

    return true; // OFFICE / ADMIN
  }

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">
            Office Request
          </h1>
          <div className="mt-2">
            <TeslaStatusChip status={request.status} />
          </div>
        </div>
      </div>

      {/* STATUS TIMELINE */}
      <TeslaSection label="Status Progression">
        <div className="flex flex-wrap gap-3">
          {STATUS_FLOW.map((status, i) => {
            const active = i <= currentIndex;
            const clickable = canClick(status, i);

            return (
              <button
                key={status}
                disabled={!clickable}
                onClick={() => updateStatus(status)}
                className={clsx(
                  "px-4 py-2 rounded-full text-xs font-semibold transition",
                  active
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-600",
                  clickable &&
                    "hover:bg-black hover:text-white cursor-pointer",
                  !clickable && "opacity-60 cursor-not-allowed"
                )}
              >
                {status.replaceAll("_", " ")}
              </button>
            );
          })}
        </div>
      </TeslaSection>

      {/* REQUEST SUMMARY */}
      <TeslaSection label="Request Details">
        <div className="text-sm space-y-1">
          <div>
            <strong>Type:</strong>{" "}
            {request.type === "TIRE_PURCHASE"
              ? "Tire Purchase"
              : "Service Request"}
          </div>

          {request.vehicle && (
            <div>
              <strong>Vehicle:</strong>{" "}
              {request.vehicle.year} {request.vehicle.make}{" "}
              {request.vehicle.model}
            </div>
          )}

          {request.notes && (
            <div>
              <strong>Notes:</strong> {request.notes}
            </div>
          )}
        </div>
      </TeslaSection>
    </div>
  );
}
