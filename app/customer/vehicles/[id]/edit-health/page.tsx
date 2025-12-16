"use client";

import { useEffect, useState } from "react";
import TeslaHealthPhotoGrid from "@/components/tesla/TeslaHealthPhotoGrid";
import { useRouter, useParams } from "next/navigation";

export default function EditVehicleHealthPage() {
  const router = useRouter();
  const params = useParams();

  const [vehicle, setVehicle] = useState<any>(null);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);

  useEffect(() => {
    async function load() {
      const r = await fetch(`/api/customer/vehicles/${params.id}`);
      const js = await r.json();

      if (js.ok) {
        setVehicle(js.row);
        setPhotos([
          js.row.health_photo_1,
          js.row.health_photo_2,
          js.row.health_photo_3,
        ]);
      }
    }
    load();
  }, [params.id]);

  async function save() {
    const r = await fetch(`/api/customer/vehicles/${params.id}/health`, {
      method: "POST",
      body: JSON.stringify({
        health_photo_1: photos[0],
        health_photo_2: photos[1],
        health_photo_3: photos[2],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const js = await r.json();
    if (js.ok) router.push("/customer/vehicles");
    else alert(js.error);
  }

  if (!vehicle) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Edit Vehicle Health Photos</h1>

      <TeslaHealthPhotoGrid photos={photos} onChange={setPhotos} />

      <button onClick={save} className="btn btn-primary w-full py-3">
        Save
      </button>
    </div>
  );
}
