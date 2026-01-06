"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequestPartsSection } from "@/components/office/RequestPartsSection";
import { OfficeFieldsSection } from "@/components/office/OfficeFieldsSection";

/* ===============================
   Icons
================================ */
const IconCar = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const IconUser = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconGauge = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 9l3-3" />
  </svg>
);

/* ===============================
   Component
================================ */
export default function OfficeRequestDetailClient({
  request: initialRequest,
}: {
  request: any;
}) {
  const router = useRouter();

  const [request, setRequest] = useState(initialRequest);
  const [serviceTitle, setServiceTitle] = useState(initialRequest.service_title || "");
  const [serviceDescription, setServiceDescription] = useState(initialRequest.service_description || "");
  const [saving, setSaving] = useState(false);

  const v = request.vehicle;
  const c = request.customer;

  const assignedTechs: string[] = request.assigned_techs || [];
  const displayMileage = request.display_mileage;

  /* ===============================
     EDIT LOCK LOGIC
  =============================== */
  const isEditable = ["NEW", "WAITING"].includes(request.status);

  /* ===============================
     SAVE CHANGES
  =============================== */
  async function handleSave() {
    if (!isEditable) return;

    setSaving(true);

    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_title: serviceTitle,
        service_description: serviceDescription,
      }),
    });

    const json = await res.json();

    if (json.ok) {
      setRequest(json.request);
    } else {
      alert("Failed to save changes");
    }

    setSaving(false);
  }

  /* ===============================
     SEND TO DISPATCH
  =============================== */
  async function handleSendToDispatch() {
    if (!isEditable) return;

    const res = await fetch(`/api/office/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "READY_TO_SCHEDULE",
      }),
    });

    const json = await res.json();

    if (json.ok) {
      setRequest(json.request);
      router.push("/office");
    } else {
      alert("Failed to send to dispatch");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">

      {/* ===============================
         TOP BAR
      =============================== */}
      <div className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
        <div>
          <div
            onClick={() => router.push("/office")}
            className="text-xs font-bold text-gray-400 uppercase cursor-pointer hover:text-black"
          >
            ← Return to Dashboard
          </div>
          <h1 className="text-xl font-bold mt-1 flex items-center gap-2">
            {request.service_title}
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border">
              {request.status}
            </span>
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!isEditable || saving}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
          >
            Save Changes
          </button>

          <button
            onClick={handleSendToDispatch}
            disabled={!isEditable}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-40"
          >
            Send to Dispatch
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ===============================
           LEFT COLUMN
        =============================== */}
        <div className="lg:col-span-4 space-y-6">

          {/* CUSTOMER */}
          <div className="bg-white rounded-xl p-5 border flex gap-4">
            <IconUser />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Customer</p>
              <p className="font-bold">{c?.name}</p>
            </div>
          </div>

          {/* VEHICLE */}
          <div className="bg-white rounded-xl border p-5">
            <div className="flex gap-4">
              <IconCar />
              <div>
                <p className="font-bold">
  {v?.year} {v?.make} {v?.model}
</p>

<p className="text-xs text-gray-500">
  VIN: {v?.vin}
</p>

{v?.plate && (
  <p className="text-xs text-gray-500">
    Plate: <span className="font-medium">{v.plate}</span>
  </p>
)}

              </div>
            </div>
          </div>

          {/* MILEAGE */}
          <div className="bg-white rounded-xl border p-5 flex gap-4">
            <IconGauge />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Mileage</p>
              <p className="font-bold">
                {displayMileage ? `${displayMileage.toLocaleString()} mi` : "—"}
              </p>
            </div>
          </div>

          {/* TECHNICIANS (READ ONLY) */}
          <div className="bg-gray-900 text-white rounded-xl p-5">
            <p className="text-xs uppercase text-gray-400 mb-1">Assigned Technician(s)</p>
            {assignedTechs.length > 0 ? (
              <ul className="space-y-1">
                {assignedTechs.map((t, idx) => (
                  <li key={idx} className="font-bold">{t}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">Unassigned</p>
            )}
          </div>
        </div>

        {/* ===============================
           RIGHT COLUMN
        =============================== */}
        <div className="lg:col-span-8 space-y-8">

          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-sm font-bold uppercase mb-4">Service Requirement</h3>

            <input
              value={serviceTitle}
              disabled={!isEditable}
              onChange={(e) => setServiceTitle(e.target.value)}
              className={`w-full text-2xl font-bold border-b outline-none mb-4 ${
                !isEditable ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />

            <textarea
              value={serviceDescription}
              disabled={!isEditable}
              onChange={(e) => setServiceDescription(e.target.value)}
              rows={4}
              className={`w-full p-4 rounded-lg ${
                !isEditable ? "bg-gray-100 cursor-not-allowed" : "bg-gray-50"
              }`}
              placeholder="Internal notes, instructions..."
            />
          </div>

          <RequestPartsSection
            requestId={request.id}
            vehicleContext={v}
            serviceContext={serviceTitle}
          />

          <OfficeFieldsSection request={request} />
        </div>
      </div>
    </div>
  );
}
