// app/customer/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/permissions";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import Lightbox from "@/components/common/Lightbox";

export default function CustomerCreateRequestPage() {
  const router = useRouter();

  // Role protection
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Vehicles
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");

  // Form fields
  const [serviceDesc, setServiceDesc] = useState("");
  const [dateRequested, setDateRequested] = useState<string>("");
  const [photos, setPhotos] = useState<File[]>([]);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // ---------------------------------------------
  // AUTH CHECK
  // ---------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) throw new Error();

        const js = await r.json();
        const role = normalizeRole(js?.role);

        if (
          role === "CUSTOMER" ||
          ["OFFICE", "FLEET_MANAGER", "ADMIN", "SUPERADMIN"].includes(
            role || ""
          )
        ) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch {
        setAuthorized(false);
      }
      setLoading(false);
    })();
  }, []);

  // ---------------------------------------------
  // LOAD VEHICLES
  // ---------------------------------------------
  useEffect(() => {
    if (!authorized) return;

    (async () => {
      try {
        const v = await fetch("/api/vehicles?scope=customer", {
          cache: "no-store",
        }).then((r) => r.json());

        setVehicles(v.rows || []);
      } catch (err) {
        console.error("Failed loading vehicles", err);
      }
    })();
  }, [authorized]);

  // ---------------------------------------------
  // PHOTO UPLOADER
  // ---------------------------------------------
  function onPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files]);

    const previews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...previews]);
  }

  async function submitCreate() {
    if (!vehicleId) return alert("Select a vehicle.");
    if (!dateRequested) return alert("Select a date.");
    if (!serviceDesc.trim()) return alert("Enter a service description.");

    const form = new FormData();
    form.append("vehicle_id", vehicleId);
    form.append("service", serviceDesc);
    form.append("date_requested", dateRequested);

    photos.forEach((p) => {
      form.append("photos", p);
    });

    try {
      const res = await fetch("/api/requests/create", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Create failed");

      alert("Service request created!");
      router.push("/customer");
    } catch (err) {
      console.error(err);
      alert("Failed to create request.");
    }
  }

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------
  if (loading) {
    return <div className="p-6">Checking access…</div>;
  }

  if (!authorized) {
    return (
      <div className="p-6 text-red-600">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-10 text-black">

      {/* HEADER */}
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          Create Service Request
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Submit a new request for your vehicle
        </p>
        <TeslaDivider className="mt-4" />
      </div>

      {/* VEHICLE SELECT */}
      <TeslaSection label="Vehicle">
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-3 text-sm"
        >
          <option value="">Select a vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {`${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim()} —{" "}
              {v.plate || v.vin}
            </option>
          ))}
        </select>
      </TeslaSection>

      {/* DATE ONLY */}
      <TeslaSection label="Preferred Date">
        <input
          type="date"
          value={dateRequested}
          onChange={(e) => setDateRequested(e.target.value)}
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-3 text-sm"
        />
      </TeslaSection>

      {/* SERVICE DESCRIPTION */}
      <TeslaSection label="Service Needed">
        <textarea
          value={serviceDesc}
          onChange={(e) => setServiceDesc(e.target.value)}
          placeholder="Describe the issue or service needed…"
          className="w-full bg-[#F5F5F5] rounded-lg px-3 py-3 text-sm min-h-[120px]"
        />
      </TeslaSection>

      {/* PHOTO UPLOAD */}
      <TeslaSection label="Photos (optional)">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onPhotoSelect}
          className="text-sm"
        />

        {/* PREVIEW GRID */}
        {photoPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {photoPreviews.map((src, i) => (
              <button
                key={i}
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
                className="rounded-lg overflow-hidden border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} className="w-full h-24 object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Lightbox */}
        <Lightbox
          open={lightboxOpen}
          images={photoPreviews.map((url) => ({
            url_work: url,
            alt: "preview",
          }))}
          index={lightboxIndex}
          onIndex={setLightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      </TeslaSection>

      {/* SUBMIT */}
      <button
        onClick={submitCreate}
        className="
          w-full py-4 rounded-xl bg-black text-white 
          text-base font-semibold tracking-tight
          hover:bg-gray-900 transition
        "
      >
        Submit Request
      </button>
    </div>
  );
}



