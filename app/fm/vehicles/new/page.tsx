"use client";
import { useEffect, useState } from "react";

type Location = { id: string; name: string; city: string; state: string };

export default function Page() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/lookups");
      const j = await r.json();
      if (r.ok) setLocations(j.locations ?? []);
      else setMsg(j.error || "Failed to load locations");
    })();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      company_id: "00000000-0000-0000-0000-000000000002",
      location_id: fd.get("location_id") || null,
      year: Number(fd.get("year")),
      make: fd.get("make"),
      model: fd.get("model"),
      vin: fd.get("vin"),
      unit_number: fd.get("unit_number") || null,
      plate: fd.get("plate") || null,
    };
    const r = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    setLoading(false);
    if (r.ok) {
      setMsg("✅ Vehicle created!");
      (e.target as HTMLFormElement).reset();
    } else {
      setMsg(`❌ ${j.error}`);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Add Vehicle</h1>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <input name="year" type="number" min="1990" max="2099" required placeholder="Year" className="border p-2 rounded" />
          <input name="make" required placeholder="Make" className="border p-2 rounded" />
          <input name="model" required placeholder="Model" className="border p-2 rounded" />
        </div>
        <input name="vin" required placeholder="VIN" className="border p-2 rounded w-full" />
        <div className="grid grid-cols-2 gap-3">
          <input name="unit_number" placeholder="Unit #" className="border p-2 rounded" />
          <input name="plate" placeholder="Plate" className="border p-2 rounded" />
        </div>
        <select name="location_id" className="border p-2 rounded w-full">
          <option value="">(No specific location)</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name} — {l.city}, {l.state}</option>
          ))}
        </select>
        <div className="flex gap-3">
          <button disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white">
            {loading ? "Saving…" : "Create Vehicle"}
          </button>
          <a href="/fm/requests/new" className="px-4 py-2 rounded border">Back to Request</a>
        </div>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </main>
  );
}
