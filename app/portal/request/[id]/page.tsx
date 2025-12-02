// app/portal/request/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

// Tesla components
import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaKV } from "@/components/tesla/TeslaKV";
import TeslaHeroBar from "@/components/tesla/TeslaHeroBar";

// PDF
import PDFButton from "@/components/PDFButton";

// AI
import { AiStatusBadge } from "@/components/autointegrate/AiStatusBadge";
import { AiRefreshButton } from "@/components/autointegrate/AiRefreshButton";

type RequestRow = {
  id: string;
  status: string;
  created_at?: string | null;
  scheduled_at?: string | null;
  service?: string | null;
  notes?: string | null;
  po?: string | null;
  mileage?: number | null;
  ai_status?: string | null;
  ai_po_number?: string | null;
  vehicle?: any;
  customer?: any;
  location?: any;
  technician?: any;
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function PortalRequestDetail({ params }: any) {
  const { id } = params;
  const supabase = supabaseBrowser();

  const [row, setRow] = useState<RequestRow | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setLoading(true);

      const data = await fetchJSON<RequestRow>(
        `/api/portal/requests/${encodeURIComponent(id)}`
      );
      setRow(data);

      const photoRes = await fetch(
        `/api/images/list?request_ids=${encodeURIComponent(id)}`,
        { credentials: "include" }
      );

      const photoJson = await photoRes.json();
      setPhotos(photoJson.byRequest?.[id] ?? []);
    } catch (e: any) {
      setErr(e.message || "Failed to load request.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  // realtime — service_requests
  useEffect(() => {
    if (!supabase) return;

    const ch = supabase
      .channel(`portal_request_${id}`)
      .on(
        "postgres_changes",
        { schema: "public", table: "service_requests", event: "*" },
        (payload) => {
          if (payload.new?.id === id) load();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [supabase, id]);

  // realtime — schedule_blocks
  useEffect(() => {
    if (!supabase) return;

    const ch = supabase
      .channel(`portal_request_blocks_${id}`)
      .on(
        "postgres_changes",
        { schema: "public", table: "schedule_blocks", event: "*" },
        (payload) => {
          if (payload.new?.request_id === id) load();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [supabase, id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!row) return <div className="p-6">Not found.</div>;

  // normalize relations
  const v = Array.isArray(row.vehicle) ? row.vehicle[0] : row.vehicle;
  const c = Array.isArray(row.customer) ? row.customer[0] : row.customer;
  const loc = Array.isArray(row.location) ? row.location[0] : row.location;

  const friendlyId = row.id.slice(0, 8);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <TeslaHeroBar
        title={`Request #${friendlyId}`}
        status={row.status}
        meta={[
          { label: "Customer", value: c?.name ?? "—" },
          {
            label: "Vehicle",
            value: v
              ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`
              : "—",
          },
          {
            label: "Created",
            value: row.created_at
              ? new Date(row.created_at).toLocaleString()
              : "—",
          },
        ]}
      />

      {/* Scheduled message */}
      {row.scheduled_at && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          Scheduled for:
          <strong> {new Date(row.scheduled_at).toLocaleString()}</strong>
        </div>
      )}

      {/* Technician assigned */}
      {row.technician?.full_name && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          Technician assigned:
          <strong> {row.technician.full_name}</strong>
        </div>
      )}

      <PDFButton requestId={row.id} />

      {/* STATUS */}
      <TeslaServiceCard title="Status">
        <TeslaSection label="Status">
          <div className="text-sm">{row.status}</div>
        </TeslaSection>

        <TeslaSection label="AutoIntegrate">
          <AiStatusBadge status={row.ai_status} po={row.ai_po_number} />
          <div className="mt-2">
            <AiRefreshButton requestId={row.id} />
          </div>
        </TeslaSection>
      </TeslaServiceCard>

      {/* SUMMARY */}
      <TeslaServiceCard title="Summary">
        <TeslaSection label="Customer">
          <TeslaKV k="Name" v={c?.name ?? "—"} />
        </TeslaSection>

        <TeslaSection label="Location">
          <TeslaKV k="Shop" v={loc?.name ?? "—"} />
        </TeslaSection>

        <TeslaSection label="Vehicle">
          <TeslaKV
            k="Vehicle"
            v={
              v
                ? [v.unit_number && `#${v.unit_number}`, v.year, v.make, v.model]
                    .filter(Boolean)
                    .join(" ")
                : "—"
            }
          />
        </TeslaSection>
      </TeslaServiceCard>

      {/* DETAILS */}
      <TeslaServiceCard title="Details">
        <TeslaSection label="Service">
          <TeslaKV k="Type" v={row.service ?? "—"} />
        </TeslaSection>

        <TeslaSection label="PO / Mileage">
          <TeslaKV k="PO" v={row.po ?? "—"} />
          <TeslaKV
            k="Mileage"
            v={row.mileage != null ? `${row.mileage} mi` : "—"}
          />
        </TeslaSection>

        {row.notes && (
          <TeslaSection label="Notes">
            <TeslaKV k="Internal Notes" v={row.notes} />
          </TeslaSection>
        )}
      </TeslaServiceCard>

      {/* PHOTOS */}
      <TeslaServiceCard title="Photos">
        {photos.length === 0 ? (
          <div className="text-gray-500 text-sm p-4">
            No photos uploaded for this request.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
            {photos.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border shadow-sm bg-white relative overflow-hidden"
              >
                <img src={p.url_thumb} className="w-full h-32 object-cover" />

                {p.ai_damage_detected && (
                  <div className="absolute top-1 left-1 bg-red-600 text-white text-[10px] px-2 py-1 rounded-md">
                    DAMAGE
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[11px] px-2 py-1">
                  {p.kind.toUpperCase()}
                </div>

                {p.ai_labels?.length > 0 && (
                  <div className="absolute bottom-6 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 line-clamp-2">
                    {p.ai_labels.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </TeslaServiceCard>
    </div>
  );
}
