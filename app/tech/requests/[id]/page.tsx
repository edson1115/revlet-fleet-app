"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import TeslaTimelineCombined from "@/components/tesla/TeslaTimelineCombined";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaPartsCard } from "@/components/tesla/TeslaPartsCard";
import TeslaBeforeAfter from "@/components/tesla/TeslaBeforeAfter";
import { useDamageAnalysis } from "@/hooks/useDamageAnalysis";
import { TeslaDamageCard } from "@/components/tesla/TeslaDamageCard";

export default function TechRequestDetailPage({ params }) {
  const router = useRouter();
  const requestId = params.id;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);

  // AI DAMAGE DETECTION HOOK
  const { analysis, loading: aiLoading, analyze } = useDamageAnalysis();

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/tech/requests/${requestId}`, {
      cache: "no-store",
    });
    const js = await res.json();

    if (js.ok) setRequest(js.row);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !request) {
    return (
      <TeslaLayoutShell>
        <div className="p-10 text-center text-gray-500">Loading request…</div>
      </TeslaLayoutShell>
    );
  }

  const vehicle = request.vehicle;
  const images = request.images || [];

  const events = [
    { label: "Created", ts: request.created_at },
    { label: "Scheduled", ts: request.scheduled_start_at },
    { label: "Started", ts: request.started_at },
    { label: "Completed", ts: request.completed_at },
  ];

  async function startJob() {
    await fetch(`/api/tech/requests/${requestId}/start`, { method: "POST" });
    load();
  }

  async function completeJob() {
    await fetch(`/api/tech/requests/${requestId}/complete`, { method: "POST" });
    load();
  }

  return (
    <TeslaLayoutShell>
      {/* BACK BUTTON */}
      <button
        onClick={() => router.push("/tech/queue")}
        className="text-sm text-gray-500 hover:text-black mb-4"
      >
        ← Back to My Jobs
      </button>

      {/* HERO BAR */}
      <TeslaHeroBar
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        subtitle={`Plate ${vehicle.plate} • VIN ${vehicle.vin}`}
        status={request.status}
      />

      <div className="max-w-4xl mx-auto p-6 space-y-10">

        {/* TIMELINE */}
        <TeslaTimelineCombined events={events} />

        <TeslaDivider />

        {/* ACTION BUTTONS */}
        <div className="flex gap-4">
          {!request.started_at && (
            <button
              onClick={startJob}
              className="px-5 py-2 bg-black text-white rounded-xl text-sm"
            >
              Start Job
            </button>
          )}

          {request.started_at && !request.completed_at && (
            <button
              onClick={completeJob}
              className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm"
            >
              Mark Complete
            </button>
          )}
        </div>

        {/* SERVICE DESCRIPTION */}
        <TeslaSection label="Service Details">
          <p className="text-sm whitespace-pre-line">
            {request.service || "—"}
          </p>
        </TeslaSection>

        {/* PARTS */}
        <TeslaSection label="Parts Used">
          <TeslaPartsCard
            parts={request.parts || []}
            setParts={async (p) => {
              await fetch(`/api/requests/${requestId}/parts`, {
                method: "POST",
                body: JSON.stringify({ parts: p }),
              });
              load();
            }}
          />
        </TeslaSection>

        {/* PHOTOS */}
        <TeslaSection label="Photos">
          {images.length === 0 && (
            <p className="text-sm text-gray-500">No photos uploaded yet.</p>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <div key={img.id} className="space-y-2">
                  <img
                    src={img.url_thumb || img.url_full}
                    className="rounded-xl border shadow-sm cursor-pointer"
                    onClick={() => analyze(img.url_full)}
                  />

                  {/* AI DAMAGE BUTTON */}
                  <button
                    onClick={() => analyze(img.url_full)}
                    className="w-full text-center px-3 py-2 bg-black text-white rounded-lg text-xs"
                  >
                    {aiLoading ? "Analyzing…" : "Run Damage Detection"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </TeslaSection>

        {/* AI DAMAGE RESULTS */}
        {analysis && (
          <TeslaSection label="AI Damage Analysis">
            <TeslaDamageCard analysis={analysis} />
          </TeslaSection>
        )}

        {/* BEFORE/AFTER */}
        {images.length >= 2 && (
          <TeslaSection label="Before & After">
            <TeslaBeforeAfter
              before={images[0].url_full}
              after={images[images.length - 1].url_full}
            />
          </TeslaSection>
        )}

        <div className="h-16" />
      </div>
    </TeslaLayoutShell>
  );
}
