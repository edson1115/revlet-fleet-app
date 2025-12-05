"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Lightbox from "@/components/common/Lightbox";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
import TeslaTimeline from "@/components/tesla/TeslaTimeline";

export default function CustomerRequestDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Lightbox
  const [open, setOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<any[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res = await fetch(`/api/customer/requests/${id}`, {
          cache: "no-store",
        });
        const js = await res.json();

        if (!res.ok) throw new Error(js.error);

        setReq(js.request);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!req) return <div className="p-6">Request not found.</div>;

  const imgs = req.images || [];

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-10">

      <a href="/customer/requests" className="text-sm text-blue-600 underline">
        ← Back to Requests
      </a>

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold">Service Request</h1>

          <p className="text-gray-600 text-sm mt-1">
            {req.vehicle.year} {req.vehicle.make} {req.vehicle.model} — Unit{" "}
            {req.vehicle.unit_number} — {req.vehicle.plate}
          </p>
        </div>

        <TeslaStatusChip status={req.status} />
      </div>

      {/* SERVICE DESCRIPTION */}
      <div>
        <h2 className="text-lg font-medium">Service Needed</h2>
        <p className="mt-3 bg-gray-100 rounded-lg p-4 whitespace-pre-line">
          {req.service}
        </p>
      </div>

      {/* REQUEST DETAILS */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Request Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">

          <div>
            <p className="text-xs text-gray-500">Preferred Date</p>
            <p className="font-medium">
              {req.date_requested
                ? new Date(req.date_requested).toLocaleDateString()
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">PO Number</p>
            <p className="font-medium">{req.po_number || "—"}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Vendor / FMC</p>
            <p className="font-medium">{req.vendor || "—"}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Urgent</p>
            <p className="font-medium">{req.urgent ? "Yes" : "No"}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Key Drop</p>
            <p className="font-medium">{req.key_drop ? "Yes" : "No"}</p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500">Parking Location</p>
            <p className="font-medium">{req.parking_location || "—"}</p>
          </div>

        </div>
      </div>

      {/* TIMELINE */}
      <TeslaTimeline
        status={req.status}
        created={req.created_at}
        waiting={req.waiting_at}
        approval={req.waiting_for_approval_at}
        parts={req.waiting_for_parts_at}
        scheduled={req.scheduled_start_at}
        started={req.started_at}
        completed={req.completed_at}
      />

      {/* PHOTOS */}
      <div className="mt-12">
        <h2 className="text-lg font-medium">Photos</h2>

        {imgs.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">No photos uploaded.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {imgs.map((img: any, i: number) => (
              <button
                key={img.id}
                onClick={() => {
                  setLightboxImages(
                    imgs.map((x: any) => ({
                      url_work: x.url_full,
                    }))
                  );
                  setIndex(i);
                  setOpen(true);
                }}
                className="group relative rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <img
                  src={img.url_thumb || img.url_full}
                  className="w-full h-32 object-cover group-hover:opacity-90 transition"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
              </button>
            ))}
          </div>
        )}

        <Lightbox
          open={open}
          images={lightboxImages}
          index={index}
          onIndex={setIndex}
          onClose={() => setOpen(false)}
        />
      </div>
    </div>
  );
}
