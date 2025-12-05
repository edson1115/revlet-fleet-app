"use client";

import { useEffect, useState } from "react";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import TeslaTimelineCombined from "@/components/tesla/TeslaTimelineCombined";
import Lightbox from "@/components/common/Lightbox";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

type Request = {
  id: string;
  status: string;
  service: string | null;
  notes: string | null;
  created_at: string | null;

  preferred_date?: string | null;

  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;

  started_at?: string | null;
  completed_at?: string | null;

  assigned_tech?: {
    id: string;
    full_name: string | null;
  } | null;

  vehicle?: {
    id: string;
    vin: string | null;
    plate: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
  } | null;

  images?: Array<{
    id: string;
    url_work: string;
    type: string | null;
  }>;
};

export default function RequestsPanel({
  customerId,
  onOpenLightbox,
}: {
  customerId: string;
  onOpenLightbox: (images: any[], index: number) => void;
}) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);

  const [noteDraft, setNoteDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // ---------------------------------------------------------------------------
  // LOAD REQUESTS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/portal/customer/${customerId}/requests`, {
        cache: "no-store",
      });
      const data = await res.json();
      setRequests(data.requests || []);
    })();
  }, [customerId]);

  // ---------------------------------------------------------------------------
  // SAVE NOTES
  // ---------------------------------------------------------------------------
  async function saveNotes(reqId: string) {
    try {
      setSavingNotes(true);

      await fetch(`/api/requests/${reqId}/internal-notes`, {
        method: "POST",
        body: JSON.stringify({ notes: noteDraft }),
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId ? { ...r, notes: noteDraft } : r
        )
      );

      alert("Notes saved.");
    } catch {
      alert("Failed to save notes.");
    } finally {
      setSavingNotes(false);
    }
  }

  // ---------------------------------------------------------------------------
  // DRAWER
  // ---------------------------------------------------------------------------
  function Drawer() {
    if (!selected) return null;

    const r = selected;

    const events = [
      { label: "Created", ts: r.created_at },
      { label: "Preferred Date", ts: r.preferred_date },
      { label: "Scheduled Start", ts: r.scheduled_start_at },
      { label: "Scheduled End", ts: r.scheduled_end_at },
      { label: "Started", ts: r.started_at },
      { label: "Completed", ts: r.completed_at },
    ];

    return (
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex justify-end">
        <div className="w-full max-w-xl bg-white h-full p-6 overflow-y-auto shadow-xl border-l border-gray-200">
          {/* CLOSE */}
          <button
            className="text-sm text-gray-600 mb-4"
            onClick={() => setSelected(null)}
          >
            ← Back
          </button>

          {/* HERO */}
          <TeslaHeroBar
            title={
              r.vehicle
                ? `${r.vehicle.year || ""} ${r.vehicle.make || ""} ${
                    r.vehicle.model || ""
                  }`.trim()
                : "Service Request"
            }
            status={r.status}
            meta={[
              { label: "Plate", value: r.vehicle?.plate },
              { label: "VIN", value: r.vehicle?.vin },
            ]}
          />

          {/* STATUS CHIP */}
          <div className="mt-4">
            <TeslaStatusChip status={r.status} size="sm" />
          </div>

          {/* TIMELINE */}
          <div className="mt-6">
            <TeslaTimelineCombined events={events} />
          </div>

          <TeslaDivider className="my-6" />

          {/* PREFERRED DATE */}
          <TeslaSection label="Preferred Service Date">
            <div className="text-sm">
              {r.preferred_date
                ? new Date(r.preferred_date).toLocaleDateString()
                : "—"}
            </div>
          </TeslaSection>

          {/* SCHEDULE WINDOW */}
          <div className="mt-6">
            <TeslaSection label="Scheduled Window">
              <div className="text-sm">
                {r.scheduled_start_at
                  ? new Date(r.scheduled_start_at).toLocaleString()
                  : "—"}{" "}
                →{" "}
                {r.scheduled_end_at
                  ? new Date(r.scheduled_end_at).toLocaleString()
                  : "—"}
              </div>

              <div className="mt-3">
                <span className="text-xs text-gray-500">Technician:</span>
                <div className="text-sm font-medium">
                  {r.assigned_tech?.full_name || "Not Assigned"}
                </div>
              </div>
            </TeslaSection>
          </div>

          {/* SERVICE DETAILS */}
          <div className="mt-6">
            <TeslaSection label="Service Requested">
              <div className="text-sm">{r.service || "—"}</div>
            </TeslaSection>
          </div>

          {/* INTERNAL NOTES (editable) */}
          <div className="mt-6">
            <TeslaSection label="Internal Notes">
              <textarea
                className="w-full bg-[#F5F5F5] rounded-lg p-3 text-sm min-h-[120px]"
                placeholder="Enter internal notes…"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
              />

              <button
                onClick={() => saveNotes(r.id)}
                disabled={savingNotes}
                className="mt-3 w-full py-3 bg-black text-white rounded-lg text-sm disabled:opacity-40"
              >
                {savingNotes ? "Saving…" : "Save Notes"}
              </button>
            </TeslaSection>
          </div>

          {/* PHOTOS */}
          <div className="mt-6">
            <TeslaSection label="Photos">
              {!r.images || r.images.length === 0 ? (
                <div className="text-sm text-gray-500">No photos uploaded.</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {r.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => onOpenLightbox(r.images!, i)}
                      className="rounded-lg overflow-hidden border border-gray-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url_work}
                        alt="photo"
                        className="w-full h-24 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </TeslaSection>
          </div>

          {/* BOTTOM SPACER */}
          <div className="h-20" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN LIST
  // ---------------------------------------------------------------------------
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-6">
        Service Requests
      </h2>

      <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
        {requests.map((r) => {
          const title =
            r.vehicle &&
            `${r.vehicle.year || ""} ${r.vehicle.make || ""} ${
              r.vehicle.model || ""
            }`.trim();

          const subtitle = r.service || "Service Request";
          const meta =
            r.created_at
              ? `Created: ${new Date(r.created_at).toLocaleDateString()}`
              : "";

          return (
            <TeslaListRow
              key={r.id}
              title={title || "Vehicle"}
              subtitle={subtitle}
              metaLeft={meta}
              status={r.status}
              rightIcon={true}
              onClick={() => {
                setSelected(r);
                setNoteDraft(r.notes || "");
              }}
            />
          );
        })}

        {requests.length === 0 && (
          <div className="p-6 text-gray-500 text-sm">No requests found.</div>
        )}
      </div>

      {selected && <Drawer />}
    </div>
  );
}
