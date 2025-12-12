"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import TeslaTimelineCombined from "@/components/tesla/TeslaTimelineCombined";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

import TeslaScheduleCard from "@/components/tesla/TeslaScheduleCard";
import { TeslaPartsCard } from "@/components/tesla/TeslaPartsCard";

// ✅ New Tesla Photo Module
import TeslaPhotoGrid from "@/components/tesla/TeslaPhotoGrid";

export default function OfficeRequestPage({ params }: any) {
  const requestId = params.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [techs, setTechs] = useState<any[]>([]);

  async function loadAll() {
    // Auth
    const me = await fetch("/api/me", { cache: "no-store" }).then((r) =>
      r.json()
    );
    setRole(me.role || null);

    // Request
    const r = await fetch(`/api/requests/${requestId}`, {
      cache: "no-store",
    }).then((res) => res.json());
    setRequest(r.row || null);

    // Tech list
    const t = await fetch("/api/techs?active=1", {
      cache: "no-store",
    }).then((res) => res.json());
    setTechs(t.rows || []);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (loading || !request) {
    return <div className="p-6">Loading request…</div>;
  }

  const events = [
    { label: "Created", ts: request.created_at },
    { label: "Preferred Date", ts: request.date_requested },
    { label: "Scheduled Start", ts: request.scheduled_start_at },
    { label: "Scheduled End", ts: request.scheduled_end_at },
    { label: "Started", ts: request.started_at },
    { label: "Completed", ts: request.completed_at },
  ];

  // ✅ Extract Tesla photo URLs
  const photos = (request.images || []).map((img: any) => img.url_full);

  return (
    <div className="p-8 space-y-10 max-w-5xl mx-auto">

      {/* BACK */}
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

      {/* TIMELINE */}
      <TeslaTimelineCombined events={events} />

      <TeslaDivider className="my-4" />

      {/* SCHEDULE */}
      <TeslaScheduleCard
        request={request}
        techs={techs}
        onRefresh={loadAll}
      />

      {/* SERVICE DESCRIPTION */}
      <TeslaSection label="Service Requested">
        <div className="text-sm whitespace-pre-line">
          {request.service || "—"}
        </div>

        {request.notes && (
          <div className="text-sm text-gray-600 mt-2">
            <strong>Customer Notes:</strong> {request.notes}
          </div>
        )}
      </TeslaSection>

      {/* INTERNAL NOTES */}
      <OfficeNotesEditor request={request} onSaved={loadAll} />

      {/* PARTS */}
      <TeslaPartsCard
        parts={request.parts || []}
        setParts={async (next) => {
          await fetch(`/api/requests/${requestId}/parts`, {
            method: "POST",
            body: JSON.stringify({ parts: next }),
          });

          loadAll();
        }}
      />

      {/* ================================
          TESLA PHOTO MODULE (NEW)
      ================================== */}
      <TeslaSection label="Photos">
        {!photos.length && (
          <div className="text-sm text-gray-500">No photos.</div>
        )}

        {photos.length > 0 && <TeslaPhotoGrid photos={photos} />}
      </TeslaSection>

      <div className="h-20" />
    </div>
  );
}

/* -----------------------------
   INTERNAL NOTES EDITOR
------------------------------ */
function OfficeNotesEditor({ request, onSaved }: any) {
  const [val, setVal] = useState(request.notes_internal || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/requests/${request.id}/update-notes`, {
      method: "POST",
      body: JSON.stringify({ notes: val }),
    });
    setSaving(false);
    onSaved?.();
  }

  return (
    <TeslaSection label="Internal Notes">
      <textarea
        className="w-full bg-[#F5F5F5] rounded-lg px-3 py-3 text-sm"
        rows={4}
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />

      <button
        onClick={save}
        disabled={saving}
        className="mt-3 px-4 py-2 bg-black text-white rounded-lg text-sm"
      >
        {saving ? "Saving…" : "Save Notes"}
      </button>
    </TeslaSection>
  );
}
