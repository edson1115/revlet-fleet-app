"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Tesla UI Components
import TeslaPhotoUploader from "@/components/tesla/TeslaPhotoUploader";
import TeslaSection from "@/components/tesla/TeslaSection";
import TeslaInput from "@/components/tesla/TeslaInput";
import TeslaButton from "@/components/tesla/TeslaButton";
import TeslaSelect from "@/components/tesla/TeslaSelect";

// AI Hooks (kept for later / optional UI display)
import { useAIProblemDetect } from "@/hooks/useAIProblemDetect";
import { useAISummary } from "@/hooks/useAISummary";
import { useAIParts } from "@/hooks/useAIParts";
import { useAINextService } from "@/hooks/useAINextService";

export default function CustomerNewRequest() {
  const router = useRouter();
  const params = useSearchParams();

  const defaultVehicleId = params.get("vehicle_id") ?? "";

  // --------------------------------------------------
  // FORM STATE
  // --------------------------------------------------
  const [vehicleId, setVehicleId] = useState(defaultVehicleId);
  const [serviceType, setServiceType] = useState("");
  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // --------------------------------------------------
  // FLOW STATE
  // --------------------------------------------------
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  // --------------------------------------------------
  // AI HOOKS (kept, not forced yet)
  // --------------------------------------------------
  useAIProblemDetect();
  useAISummary();
  useAIParts();
  useAINextService();

  // --------------------------------------------------
  // LOAD VEHICLES
  // --------------------------------------------------
  useEffect(() => {
    async function loadVehicles() {
      const res = await fetch("/api/customer/vehicles", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setVehicles(json.vehicles || []);
      setLoadingVehicles(false);
    }

    loadVehicles();
  }, []);

  // --------------------------------------------------
  // CREATE REQUEST (STEP 1)
  // --------------------------------------------------
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

    photos.forEach((file, index) => {
      form.append(`photo_${index}`, file);
    });

    const res = await fetch("/api/customer/requests", {
      method: "POST",
      body: form,
    });

    const js = await res.json();

    if (!js.ok) {
      alert(js.error || "Failed to create request.");
      return;
    }

    // ✅ DO NOT REDIRECT
    setCreatedRequestId(js.request.id);
  }

  // --------------------------------------------------
  // RUN AI (STEP 2)
  // --------------------------------------------------
  async function handleRunAI() {
    if (!createdRequestId) return;

    setAiRunning(true);

    const res = await fetch("/api/ai/analyze-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: createdRequestId,
      }),
    });

    const js = await res.json();
    setAiRunning(false);

    if (!js.ok) {
      alert("AI analysis failed.");
      return;
    }

    setAiDone(true);
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">
        Create Service Request
      </h1>

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
          placeholder="Enter mileage"
          value={mileage}
          onChange={(e: any) => setMileage(e.target.value)}
        />
      </TeslaSection>

      {/* NOTES */}
      <TeslaSection label="Notes">
        <TeslaInput
          label="Additional Notes"
          placeholder="Describe the issue..."
          value={notes}
          onChange={(e: any) => setNotes(e.target.value)}
        />
      </TeslaSection>

      {/* PHOTOS */}
      <TeslaSection label="Upload Photos">
        <TeslaPhotoUploader files={photos} setFiles={setPhotos} />
      </TeslaSection>

      {/* ACTIONS */}
      {!createdRequestId && (
        <TeslaButton onClick={handleCreate}>
          Create Request
        </TeslaButton>
      )}

      {createdRequestId && (
        <TeslaSection label="Next Steps">
          <TeslaButton onClick={handleRunAI} disabled={aiRunning}>
            {aiRunning ? "Running AI…" : "Run AI Analysis"}
          </TeslaButton>

          {aiDone && (
            <TeslaButton
              className="mt-3"
              onClick={() =>
                router.push(`/customer/requests/${createdRequestId}`)
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
