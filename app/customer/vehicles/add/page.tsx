"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddVehiclePage() {
  const router = useRouter();

  // -----------------------------
  // FORM STATE
  // -----------------------------
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [unit, setUnit] = useState("");
  const [providerCompanyId, setProviderCompanyId] = useState("");

  // NEW — Health photos
  const [photo1, setPhoto1] = useState<string | null>(null);
  const [photo2, setPhoto2] = useState<string | null>(null);
  const [photo3, setPhoto3] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);

  const [providers, setProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // -----------------------------
  // LOAD FMC PROVIDER DROPDOWN
  // -----------------------------
  useEffect(() => {
    async function loadProviders() {
      const r = await fetch("/api/providers/provider-companies", {
        cache: "no-store",
      });
      const js = await r.json();
      if (js.ok) setProviders(js.rows);
      setLoadingProviders(false);
    }
    loadProviders();
  }, []);

  // -----------------------------
  // UPLOAD HEALTH PHOTO
  // -----------------------------
  async function uploadHealthPhoto(slot: number, file: File) {
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/uploads/vehicle-health", {
      method: "POST",
      body: fd,
    });

    const js = await res.json();
    setUploading(false);

    if (!js.ok) {
      alert("Upload failed: " + js.error);
      return;
    }

    const url = js.url;

    if (slot === 1) setPhoto1(url);
    if (slot === 2) setPhoto2(url);
    if (slot === 3) setPhoto3(url);
  }

  // -----------------------------
  // SUBMIT FORM
  // -----------------------------
  async function submit() {
    if (!year || !make || !model) {
      alert("Year, Make, and Model are required.");
      return;
    }

    const r = await fetch("/api/customer/vehicles", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        year: Number(year),
        make,
        model,
        plate,
        vin,
        unit_number: unit,
        provider_company_id: providerCompanyId || null,
        health_photo_1: photo1,
        health_photo_2: photo2,
        health_photo_3: photo3,
      }),
    });

    const js = await r.json();
    if (!js.ok) {
      alert(js.error || "Failed to save vehicle");
      return;
    }

    router.push("/customer/vehicles");
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Add Vehicle</h1>

      {/* YEAR */}
      <Field label="Year" value={year} onChange={setYear} type="number" placeholder="2021" />

      {/* MAKE */}
      <Field label="Make" value={make} onChange={setMake} placeholder="Ford" />

      {/* MODEL */}
      <Field label="Model" value={model} onChange={setModel} placeholder="Transit" />

      {/* PLATE */}
      <Field label="Plate" value={plate} onChange={setPlate} placeholder="8XYZ123" />

      {/* VIN */}
      <Field label="VIN" value={vin} onChange={setVin} placeholder="1FTBR1C80MKA12345" />

      {/* UNIT NUMBER */}
      <Field label="Unit Number" value={unit} onChange={setUnit} placeholder="A123" />

      {/* FMC PROVIDER */}
      <div className="space-y-2">
        <label className="font-medium">Fleet Management Company (FMC)</label>

        {loadingProviders ? (
          <div className="text-sm text-gray-500">Loading providers…</div>
        ) : (
          <select
            className="w-full border p-3 rounded-lg"
            value={providerCompanyId}
            onChange={(e) => setProviderCompanyId(e.target.value)}
          >
            <option value="">None</option>

            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* HEALTH PHOTOS */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-semibold">Vehicle Health Photos</h2>

        {[1, 2, 3].map((slot) => {
          const url =
            slot === 1 ? photo1 : slot === 2 ? photo2 : photo3;

          return (
            <div key={slot} className="border p-4 rounded-xl space-y-2">
              <label className="font-medium">Photo #{slot}</label>

              {url ? (
                <img
                  src={url}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    uploadHealthPhoto(slot, e.target.files[0]);
                  }
                }}
              />

              {uploading && (
                <div className="text-sm text-gray-500">Uploading…</div>
              )}
            </div>
          );
        })}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={submit}
        className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition"
      >
        Save Vehicle
      </button>
    </div>
  );
}

/* -----------------------------------------
   UI HELPER COMPONENT
----------------------------------------- */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="font-medium">{label}</label>
      <input
        type={type}
        className="w-full border p-3 rounded-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
