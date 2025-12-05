// app/customer/requests/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CustomerCreateRequestPage() {
  const router = useRouter();
  const params = useSearchParams();

  const vehicleId = params.get("vehicle_id"); // from /requests/new

  const [vehicle, setVehicle] = useState<any>(null);
  const [service, setService] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ----------------------------------------------------
  // LOAD VEHICLE
  // ----------------------------------------------------
  useEffect(() => {
    if (!vehicleId) {
      setErr("Missing vehicle");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch(`/api/customer/vehicles/${vehicleId}`);
        const js = await res.json();

        if (!res.ok) throw new Error(js.error || "Failed to load vehicle");

        setVehicle(js.vehicle);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [vehicleId]);

  // ----------------------------------------------------
  // PHOTO HANDLING
  // ----------------------------------------------------
  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files]);
    setPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  }

  // ----------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------
  async function submit() {
    if (!service.trim()) {
      alert("Enter a service description");
      return;
    }

    const form = new FormData();
    form.append("vehicle_id", vehicleId!);
    form.append("service", service);

    photos.forEach((p) => form.append("photos", p));

    try {
      const res = await fetch("/api/customer/requests/create", {
        method: "POST",
        body: form,
      });

      const js = await res.json();

      if (!res.ok) throw new Error(js.error || "Failed to create request");

      // Redirect to new request detail page
      router.push(`/customer/requests/${js.request.id}`);
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading)
    return <div className="p-6 text-gray-500">Loading vehicle…</div>;
  if (err)
    return (
      <div className="p-6 text-red-600">Error loading page: {err}</div>
    );

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 underline"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-semibold">New Service Request</h1>
      <p className="text-gray-600">
        Vehicle: {vehicle.year} {vehicle.make} {vehicle.model} —{" "}
        {vehicle.plate}
      </p>

      {/* SERVICE DESCRIPTION */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Describe the issue</label>
        <textarea
          className="w-full border rounded-xl p-3 text-sm bg-[#FAFAFA]"
          rows={5}
          value={service}
          onChange={(e) => setService(e.target.value)}
        />
      </div>

      {/* PHOTO UPLOAD */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Photos (optional)
        </label>
        <input type="file" multiple accept="image/*" onChange={onSelect} />

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {previews.map((src, i) => (
              <img
                key={i}
                src={src}
                className="rounded-xl h-24 w-full object-cover border"
              />
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT */}
      <button
        onClick={submit}
        className="w-full bg-black text-white py-3 rounded-xl text-base font-semibold"
      >
        Submit Request
      </button>
    </div>
  );
}
