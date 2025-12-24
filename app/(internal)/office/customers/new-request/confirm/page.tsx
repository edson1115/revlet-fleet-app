"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import TeslaSection from "@/components/tesla/TeslaSection";
import OfficeStepHeader from "@/components/office/OfficeStepHeader";

type Customer = {
  id: string;
  name: string;
};

type Vehicle = {
  id: string;
  year?: number;
  make?: string;
  model?: string;
  plate?: string;
  vin?: string;
  unit_number?: string;
};

export default function OfficeConfirmRequestPage() {
  const router = useRouter();
  const params = useSearchParams();

  const customerId = params.get("customerId");
  const vehicleId = params.get("vehicleId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [urgent, setUrgent] = useState(false);

  /* ---------------------------------------------------------
     LOAD CONTEXT
  --------------------------------------------------------- */
  useEffect(() => {
    if (!customerId) return;

    async function load() {
      try {
        const [cRes, vRes] = await Promise.all([
          fetch(`/api/office/customers/${customerId}`, {
            cache: "no-store",
            credentials: "include",
          }),
          vehicleId
            ? fetch(`/api/office/vehicles/${vehicleId}`, {
                cache: "no-store",
                credentials: "include",
              })
            : null,
        ]);

        const cJson = await cRes.json();
        if (cJson.ok) setCustomer(cJson.customer);

        if (vRes) {
          const vJson = await vRes.json();
          if (vJson.ok) setVehicle(vJson.vehicle);
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    }

    load();
  }, [customerId, vehicleId]);

  /* ---------------------------------------------------------
     CREATE REQUEST
  --------------------------------------------------------- */
  async function handleCreate() {
    if (!customerId) return;

    setSaving(true);

    const res = await fetch("/api/office/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        customer_id: customerId,
        vehicle_id: vehicleId, // may be null → allowed
        urgent,
      }),
    });

    const js = await res.json();
    setSaving(false);

    if (!res.ok || !js.ok) {
      alert(js.error || "Failed to create request");
      return;
    }

    router.push(`/office/requests`);
  }

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */
  if (loading) {
    return <div className="p-8">Loading request details…</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <OfficeStepHeader
        title="Confirm Service Request"
        backHref={`/office/customers/new-request/vehicle?customerId=${customerId}`}
        rightAction={{
          label: "Dashboard",
          href: "/office",
        }}
      />

      {/* CUSTOMER */}
      <TeslaSection label="Customer">
        <div className="font-medium">
          {customer?.name ?? "Unknown customer"}
        </div>
      </TeslaSection>

      {/* VEHICLE */}
      <TeslaSection label="Vehicle">
        {vehicle ? (
          <>
            <div className="font-medium">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </div>
            <div className="text-sm text-gray-500">
              {vehicle.unit_number ||
                vehicle.plate ||
                vehicle.vin ||
                "—"}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500 italic">
            Vehicle not assigned yet (walk-in / expedited)
          </div>
        )}
      </TeslaSection>

      {/* OPTIONS */}
      <TeslaSection label="Options">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
          />
          Mark as urgent
        </label>
      </TeslaSection>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="px-5 py-2 rounded-lg border"
        >
          Back
        </button>

        <button
          disabled={saving}
          onClick={handleCreate}
          className={`px-5 py-2 rounded-lg ${
            saving
              ? "bg-gray-400 text-gray-700"
              : "bg-black text-white"
          }`}
        >
          {saving ? "Creating…" : "Create Request"}
        </button>
      </div>
    </div>
  );
}
