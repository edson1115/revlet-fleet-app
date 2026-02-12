"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import RequestVehicleCard from "./RequestVehicleCard";
import RequestStatusControls from "./RequestStatusControls";
import RequestPartsPanel from "./RequestPartsPanel";
import RequestNotesPanel from "./RequestNotesPanel";
import RequestTimeline from "./RequestTimeline";

type Note = { id: string; text: string; created_at?: string | null };

type Req = {
  id: string;
  status: string;
  service?: string | null;
  fmc?: string | null;
  po?: string | null;

  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;
  created_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;

  customer?: { id: string; name?: string | null } | null;

  vehicle?: {
    id: string;
    unit_number?: string | null;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    vin?: string | null;
  } | null;

  location?: { id: string; name?: string | null } | null;

  technician?: { id: string | null; name?: string | null } | null;

  notes?: string | null;
  internal_notes?: string | null;
  dispatch_notes?: string | null;

  images?: any[];
};

async function getJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json() as Promise<T>;
}

export default function RequestDrawer({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const [row, setRow] = useState<Req | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const refresh = async () => {
    try {
      setErr("");
      const data = await getJSON<{ request: Req; parts: any[] }>(
        `/api/requests/${id}`
      );
      // API returns { request, parts }
      setRow({
        ...data.request,
        parts: data.parts,
      } as Req);
    } catch (e: any) {
      setErr(e?.message || "Failed to load request");
    }
  };

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e: any) {
        if (m) setErr(e?.message || "Failed to load request");
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => {
      m = false;
    };
  }, [id]);

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />

      {/* DRAWER */}
      <div
        className="
          fixed right-0 top-0 h-full w-[560px]
          bg-white shadow-2xl z-[60]
          overflow-y-auto
          animate-slideIn
          flex flex-col
        "
      >
        {/* HEADER */}
        <div className="p-5 flex items-center justify-between border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold">Request #{id}</h2>
            {row && (
              <p className="text-xs text-gray-500 mt-1">
                {row.service || "Service"} — {row.status}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-6">
          {err && (
            <div className="border border-red-300 bg-red-50 text-red-800 p-3 rounded-lg">
              {err}
            </div>
          )}

          {loading || !row ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : (
            <>
              {/* VEHICLE CARD */}
              <RequestVehicleCard vehicle={row.vehicle} />

              {/* STATUS BUTTONS */}
              <RequestStatusControls
                id={id}
                status={row.status}
                refresh={refresh}
              />

              {/* PARTS USED */}
              <RequestPartsPanel requestId={id} />

              {/* NOTES */}
              {/* FIX: Use nullish coalescing to ensure notes are never undefined */}
              <RequestNotesPanel
                id={id}
                notes={row.notes ?? null}
                dispatchNotes={row.dispatch_notes ?? null}
                refresh={refresh}
              />

              {/* TIMELINE */}
              <RequestTimeline request={row} />

              {/* IMAGES (OPTIONAL) */}
              {row.images && row.images.length > 0 && (
                <div className="border rounded-2xl p-4 bg-white shadow-sm space-y-3">
                  <div className="text-xs uppercase text-gray-500">Images</div>

                  <div className="grid grid-cols-2 gap-2">
                    {row.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.url_thumb}
                        className="rounded-xl border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ANIMATION STYLE */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0%);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
    </>
  );
}