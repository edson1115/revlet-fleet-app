"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileLeadHeader } from "@/components/mobile/sales/MobileLeadHeader";
import { MobileLeadActions } from "@/components/mobile/sales/MobileLeadActions";
import { MobileLeadPhotoGrid } from "@/components/mobile/sales/MobileLeadPhotoGrid";

export default function MobileSalesLeadDetail({ params }: any) {
  const id = params.id;
  const router = useRouter();

  const [lead, setLead] = useState<any>(null);
  const [updates, setUpdates] = useState([]);
  const [photos, setPhotos] = useState([]);

  async function load() {
    const r = await fetch(`/api/sales/leads/${id}`).then((r) => r.json());
    if (r.ok) {
      setLead(r.lead);
      setUpdates(r.updates);
      setPhotos(r.photos);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!lead) {
    return <div className="p-4 text-gray-500">Loading…</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* HEADER */}
      <MobileLeadHeader lead={lead} />

      {/* ACTIONS */}
      <MobileLeadActions lead={lead} onRefresh={load} />

      {/* PHOTOS */}
      <MobileLeadPhotoGrid photos={photos} />
    </div>
  );
}
