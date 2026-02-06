"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import TeslaTimelineCombined from "@/components/tesla/TeslaTimelineCombined";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import Lightbox from "@/components/common/Lightbox";
import { TeslaLeadConvertPanel } from "@/components/tesla/sales/TeslaLeadConvertPanel";
import { TeslaLeadUpdatePanel } from "@/components/tesla/sales/TeslaLeadUpdatePanel";

export default function SalesLeadDetailPage({ params }: any) {
  const id = params.id;
  const router = useRouter();

  const [lead, setLead] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [photos, setPhotos] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  async function load() {
    setLoading(true);

    const r = await fetch(`/api/sales/leads/${id}`).then((r) => r.json());
    if (r.ok) {
      setLead(r.lead);
      setUpdates(r.updates);
      setPhotos(r.photos || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading || !lead) {
    return <div className="p-8 text-gray-500">Loading…</div>;
  }

  const events = updates
    .map((u) => ({
      label: u.update_type,
      ts: u.created_at,
    }))
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <button
        onClick={() => router.push("/sales/leads")}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Back to Leads
      </button>

      <TeslaHeroBar
        title={lead.business_name}
        status={lead.status}
        meta={[
          { label: "Market", value: lead.market },
          { label: "Created", value: new Date(lead.created_at).toLocaleDateString() },
        ]}
      />

      {/* TIMELINE */}
      <TeslaTimelineCombined events={events} />

      {/* LEAD DATA */}
      <TeslaSection label="Lead Details">
        <div className="text-sm space-y-2">
          <div><b>Phone:</b> {lead.phone || "—"}</div>
          <div><b>Visit Type:</b> {lead.visit_type}</div>
          <div><b>Notes:</b> {lead.notes || "—"}</div>
        </div>
      </TeslaSection>

      {/* PHOTOS */}
      <TeslaSection label="Visit Photos">
        {!photos.length && <div className="text-gray-500 text-sm">No photos uploaded.</div>}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((img: any, i: number) => (
              <button
                key={img.id}
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
                className="rounded-lg border overflow-hidden"
              >
                <img src={img.url_thumb} className="w-full h-28 object-cover" />
              </button>
            ))}
          </div>
        )}
      </TeslaSection>

      {/* UPDATE PANEL */}
      <TeslaLeadUpdatePanel leadId={id} onRefresh={load} />

      {/* CONVERT PANEL */}
      {lead.status !== "CONVERTED" && (
        <TeslaLeadConvertPanel lead={lead} onRefresh={load} />
      )}

      {/* LIGHTBOX */}
      <Lightbox
        open={lightboxOpen}
        images={photos.map((p: any) => ({ url_work: p.url_full }))}
        index={lightboxIndex}
        onIndex={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
