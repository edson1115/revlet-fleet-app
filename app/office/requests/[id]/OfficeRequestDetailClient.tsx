"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import TeslaTimelineCombined from "@/components/tesla/TeslaTimelineCombined";
import TeslaScheduleCard from "@/components/tesla/TeslaScheduleCard";
import { TeslaPartsCard } from "@/components/tesla/TeslaPartsCard";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import Lightbox from "@/components/common/Lightbox";

export default function OfficeRequestDetailClient({ params }: any) {
  const requestId = params.id;
  const router = useRouter();

  const [request, setRequest] = useState<any>(null);
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  async function load() {
    setLoading(true);

    const req = await fetch(`/api/requests/${requestId}`, {
      cache: "no-store",
    }).then((r) => r.json());

    const t = await fetch(`/api/techs?active=1`, {
      cache: "no-store",
    }).then((r) => r.json());

    setRequest(req.row || null);
    setTechs(t.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !request) {
    return <div className="p-6 text-gray-500">Loading request…</div>;
  }

  const events = [
    { label: "Created", ts: request.created_at },
    { label: "Preferred Date", ts: request.date_requested },
    { label: "Scheduled Start", ts: request.scheduled_start_at },
    { label: "Scheduled End", ts: request.scheduled_end_at },
    { label: "Started", ts: request.started_at },
    { label: "Completed", ts: request.completed_at },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* Back Button */}
      <button
        onClick={() => router.push("/office/requests")}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Back to Requests
      </button>

      {/* HERO */}
      <TeslaHeroBar
        title={
          request.vehicle
            ? `${request.vehicle.year} ${request.vehicle.make} ${request.vehicle.model}`
            : "Service Request"
        }
        status={request.status}
        meta={[
          { label: "Plate", value: request.vehicle?.plate },
          { label: "VIN", value: request.vehicle?.vin },
        ]}
      />

      {/* Timeline */}
      <TeslaTimelineCombined events={events} />

      <TeslaDivider className="my-4" />

      {/* Schedule */}
      <TeslaScheduleCard request={request} techs={techs} onRefresh={load} />

      {/* Service */}
      <TeslaSection label="Service Requested">
        <div className="text-sm whitespace-pre-line">
          {request.service || "—"}
        </div>
      </TeslaSection>

      {/* Parts */}
      <TeslaPartsCard
        parts={request.parts || []}
        setParts={async (next) => {
          await fetch(`/api/requests/${requestId}/parts`, {
            method: "POST",
            body: JSON.stringify({ parts: next }),
          });
          load();
        }}
      />

      {/* Photos */}
      <TeslaSection label="Photos">
        {!request.images?.length && (
          <div className="text-sm text-gray-500">No photos.</div>
        )}

        {request.images?.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {request.images.map((img: any, i: number) => (
              <button
                key={img.id}
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
                className="rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={img.url_thumb || img.url_full}
                  className="w-full h-24 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </TeslaSection>

      <Lightbox
        open={lightboxOpen}
        images={(request.images || []).map((img: any) => ({
          url_work: img.url_full,
        }))}
        index={lightboxIndex}
        onIndex={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
