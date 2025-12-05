"use client";

import { useEffect, useState } from "react";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaKV } from "@/components/tesla/TeslaKV";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";

import RequestPhotoUploader from "@/components/customer/RequestPhotoUploader";

type Props = {
  request: any;
  onClose: () => void;
};

export default function RequestDrawer({ request, onClose }: Props) {
  const [row, setRow] = useState<any>(request);
  const [loading, setLoading] = useState(false);

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false);

  // REFRESH after uploading or after an event
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/requests/${request.id}`, {
        cache: "no-store",
      }).then((x) => x.json());

      setRow(r.request || request);
    } catch {
      setRow(request);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (!row) return null;

  const vehicle = row.vehicle || {};
  const photos = row.images || [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-xl">

        {/* BACK BUTTON */}
        <button
          onClick={onClose}
          className="text-sm text-gray-600 mb-4 hover:text-black"
        >
          ← Back
        </button>

        {/* HERO */}
        <TeslaHeroBar
          title={`Request #${row.id.slice(0, 8)}`}
          status={row.status}
          meta={[
            {
              label: "Vehicle",
              value: `${vehicle.year || ""} ${vehicle.make || ""} ${
                vehicle.model || ""
              }`,
            },
            {
              label: "Created",
              value: row.created_at
                ? new Date(row.created_at).toLocaleString()
                : "—",
            },
          ]}
        />

        {/* SUMMARY */}
        <TeslaServiceCard title="Summary">
          <TeslaSection label="Service">
            {row.service || "—"}
          </TeslaSection>

          <TeslaSection label="Notes">
            {row.notes || "—"}
          </TeslaSection>

          <TeslaSection label="Vehicle">
            <div className="text-sm space-y-1">
              <TeslaKV k="Year" v={vehicle.year} />
              <TeslaKV k="Make" v={vehicle.make} />
              <TeslaKV k="Model" v={vehicle.model} />
              <TeslaKV k="Plate" v={vehicle.plate || "—"} />
              <TeslaKV k="VIN" v={vehicle.vin || "—"} />
            </div>
          </TeslaSection>
        </TeslaServiceCard>

        {/* PHOTOS */}
        <TeslaServiceCard title="Photos">
          {photos.length === 0 && (
            <div className="text-sm text-gray-500">No photos uploaded yet.</div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            {photos.map((p: any) => (
              <div key={p.id} className="relative">
                <img
                  src={p.url_full || p.url_thumb}
                  className="w-full h-32 object-cover rounded-lg border cursor-pointer"
                  onClick={() => window.open(p.url_full, "_blank")}
                />

                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                  {p.kind}
                </span>
              </div>
            ))}
          </div>

          {/* UPLOAD BUTTON */}
          <button
            onClick={() => setUploadOpen(true)}
            className="w-full mt-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition"
          >
            Upload Photo
          </button>
        </TeslaServiceCard>

        {/* STATUS HISTORY */}
        <TeslaServiceCard title="Status Timeline">
          <TeslaSection label="Requested">
            {row.created_at
              ? new Date(row.created_at).toLocaleString()
              : "—"}
          </TeslaSection>

          <TeslaSection label="Scheduled Start">
            {row.scheduled_start_at
              ? new Date(row.scheduled_start_at).toLocaleString()
              : "—"}
          </TeslaSection>

          <TeslaSection label="Work Started">
            {row.started_at
              ? new Date(row.started_at).toLocaleString()
              : "—"}
          </TeslaSection>

          <TeslaSection label="Completed">
            {row.completed_at
              ? new Date(row.completed_at).toLocaleString()
              : "—"}
          </TeslaSection>
        </TeslaServiceCard>

        {/* UPLOAD MODAL */}
        {uploadOpen && (
          <RequestPhotoUploader
            requestId={row.id}
            onUploaded={() => load()}
            onClose={() => setUploadOpen(false)}
          />
        )}
      </div>
    </div>
  );
}



