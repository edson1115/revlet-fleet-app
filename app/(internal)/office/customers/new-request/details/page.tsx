"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import TeslaSection from "@/components/tesla/TeslaSection";
import OfficeStepHeader from "@/components/office/OfficeStepHeader";

type ServiceType = "SERVICE" | "TIRES" | "BOTH";

export default function OfficeRequestDetailsPage() {
  const router = useRouter();
  const params = useSearchParams();

  const customerId = params.get("customerId");
  const vehicleId = params.get("vehicleId");

  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);

  const canContinue =
    !!customerId &&
    !!vehicleId &&
    mileage.trim().length > 0 &&
    !!serviceType;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <OfficeStepHeader
        title="Request Details"
        backHref={`/office/customers/new-request/vehicle?customerId=${customerId}`}
        rightAction={{
          label: "Dashboard",
          href: "/office",
        }}
      />

      {/* SERVICE TYPE */}
      <TeslaSection label="Service Type">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["SERVICE", "TIRES", "BOTH"] as ServiceType[]).map((type) => (
            <button
              key={type}
              onClick={() => setServiceType(type)}
              className={`p-4 rounded-xl border text-left transition ${
                serviceType === type
                  ? "border-black bg-gray-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="font-medium">
                {type === "SERVICE" && "Service / Repair"}
                {type === "TIRES" && "Tires Only"}
                {type === "BOTH" && "Service + Tires"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {type === "SERVICE" &&
                  "Maintenance, diagnostics, repairs"}
                {type === "TIRES" &&
                  "Replacement, rotation, balance"}
                {type === "BOTH" &&
                  "Combined service and tire work"}
              </div>
            </button>
          ))}
        </div>
      </TeslaSection>

      {/* MILEAGE */}
      <TeslaSection label="Current Mileage">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Enter current mileage"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </TeslaSection>

      {/* NOTES */}
      <TeslaSection label="Customer Concern / Notes">
        <textarea
          rows={4}
          placeholder="Describe the issue, request, or concern…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-black"
        />
      </TeslaSection>

      {/* ACTIONS */}
      <div className="flex justify-end">
        <button
          disabled={!canContinue}
          onClick={() =>
            router.push(
              `/office/customers/new-request/confirm?customerId=${customerId}&vehicleId=${vehicleId}&mileage=${mileage}&serviceType=${serviceType}&notes=${encodeURIComponent(
                notes
              )}`
            )
          }
          className={`px-6 py-2 rounded-lg ${
            canContinue
              ? "bg-black text-white"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
