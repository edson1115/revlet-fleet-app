"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import TeslaPhotoUploader from "@/components/tesla/TeslaPhotoUploader";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import TeslaInput from "@/components/tesla/TeslaInput";
import TeslaButton from "@/components/tesla/TeslaButton";
import TeslaSelect from "@/components/tesla/TeslaSelect";

// AI hooks
import { useAIProblemDetect } from "@/hooks/useAIProblemDetect";
import { useAISummary } from "@/hooks/useAISummary";
import { useAIParts } from "@/hooks/useAIParts";
import { useAINextService } from "@/hooks/useAINextService";

type Mode = "customer" | "office";

type Props = {
  mode: Mode;
  customerId?: string;
  vehicleId?: string;
};

export default function RequestCreateForm({
  mode,
  customerId,
  vehicleId: presetVehicleId,
}: Props) {
  const router = useRouter();

  // ---------------- FORM STATE ----------------
  const [vehicleId, setVehicleId] = useState(presetVehicleId ?? "");
  const [serviceType, setServiceType] = useState("");
  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]); // This expects File[] based on your code

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // ---------------- FLOW STATE ----------------
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  // ---------------- AI HOOKS ----------------
  useAIProblemDetect();
  useAISummary();
  useAIParts();
  useAINextService();

  // ---------------- LOAD VEHICLES ----------------
  useEffect(() => {
    async function loadVehicles() {
      const url =
        mode === "office"
          ? `/api/office/customers/${customerId}/vehicles`
          : `/api/customer/vehicles`;

      const res = await fetch(url, { cache: "no-store", credentials: "include" });
      const json = await res.json();

      setVehicles(json.vehicles ?? []);
      setLoadingVehicles(false);
    }

    loadVehicles();
  }, [mode, customerId]);

  // ---------------- CREATE REQUEST ----------------
  async function handleCreate() {
    if (!vehicleId || !serviceType) {
      alert("Please select a vehicle and service type.");
      return;
    }

    const form = new FormData();
    form.append("vehicle_id", vehicleId);
    form.append("service_type", serviceType);
    if (mileage) form.append("mileage", mileage);
    form.append("notes", notes);

    if (mode === "office" && customerId) {
      form.append("customer_id", customerId);
    }

    photos.forEach((file, index) => {
      form.append(`photo_${index}`, file);
    });

    const endpoint =
      mode === "office" ? "/api/office/requests" : "/api/customer/requests";

    const res = await fetch(endpoint, {
      method: "POST",
      body: form,
      credentials: "include",
    });

    const js = await res.json();

    if (!js.ok) {
      alert(js.error || "Failed to create request.");
      return;
    }

    setCreatedRequestId(js.request?.id || js.request_id);
  }

  // ---------------- RUN AI ----------------
  async function handleRunAI() {
    if (!createdRequestId) return;

    setAiRunning(true);

    const res = await fetch("/api/ai/analyze-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: createdRequestId }),
    });

    const js = await res.json();
    setAiRunning(false);

    if (!js.ok) {
      alert("AI analysis failed.");
      return;
    }

    setAiDone(true);
  }

  // ---------------- UI ----------------
  return (
    <div className="space-y-6">
      {/* VEHICLE */}
      <TeslaSection label="Vehicle">
        {loadingVehicles ? (
          <div className="text-gray-500">Loading vehicles…</div>
        ) : (
          <TeslaSelect
            label="Select Vehicle"
            value={vehicleId}
            onChange={(e: any) => setVehicleId(e.target.value)}
            options={vehicles.map((v: any) => ({
              label: `${v.year} ${v.make} ${v.model}`,
              value: v.id,
            }))}
            placeholder="Choose a vehicle"
          />
        )}
      </TeslaSection>

      {/* SERVICE TYPE */}
      <TeslaSection label="Service Type">
        <TeslaSelect
          label="What do you need?"
          value={serviceType}
          onChange={(e: any) => setServiceType(e.target.value)}
          options={[
            { label: "General Inspection", value: "general_inspection" },
            { label: "Tire Replacement", value: "tire_replacement" },
            { label: "Oil Change", value: "oil_change" },
            { label: "Brake Service", value: "brakes" },
            { label: "Battery Issue", value: "battery" },
            { label: "Other", value: "other" },
          ]}
        />
      </TeslaSection>

      {/* MILEAGE */}
      <TeslaSection label="Mileage">
        <TeslaInput
          type="number"
          label="Current Mileage"
          value={mileage}
          onChange={(e: any) => setMileage(e.target.value)}
        />
      </TeslaSection>

      {/* NOTES */}
      <TeslaSection label="Notes">
        <TeslaInput
          label="Additional Notes"
          value={notes}
          onChange={(e: any) => setNotes(e.target.value)}
        />
      </TeslaSection>

      {/* PHOTOS */}
      <TeslaSection label="Upload Photos">
        {/* Ensure TeslaPhotoUploader accepts these props. Assuming it matches previous context */}
        <TeslaPhotoUploader files={photos} setFiles={setPhotos} />
      </TeslaSection>

      {!createdRequestId && (
        <TeslaButton onClick={handleCreate}>
          Create Request
        </TeslaButton>
      )}

      {createdRequestId && (
        <TeslaSection label="Next Steps">
          {/* FIX: Removed 'disabled' prop. Implemented disabled behavior via onClick and className. */}
          <TeslaButton 
            onClick={() => {
              if (!aiRunning) handleRunAI();
            }} 
            className={aiRunning ? "opacity-50 pointer-events-none" : ""}
          >
            {aiRunning ? "Running AI…" : "Run AI Analysis"}
          </TeslaButton>

          {aiDone && (
            <TeslaButton
              className="mt-3"
              onClick={() =>
                router.push(
                  mode === "office"
                    ? `/office/requests/${createdRequestId}`
                    : `/customer/requests/${createdRequestId}`
                )
              }
            >
              View Request
            </TeslaButton>
          )}
        </TeslaSection>
      )}
    </div>
  );
}