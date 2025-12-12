"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditVehiclePage() {
  const params = useParams();
  const id = params?.id as string;

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [unit, setUnit] = useState("");
  const [group, setGroup] = useState("");

  async function load() {
    const res = await fetch(`/api/customer/vehicles/${id}`, {
      cache: "no-store",
      credentials: "include",
    });
    const js = await res.json();
    if (res.ok) {
      setVehicle(js.vehicle);
      setMake(js.vehicle.make || "");
      setModel(js.vehicle.model || "");
      setYear(js.vehicle.year || "");
      setPlate(js.vehicle.plate || "");
      setUnit(js.vehicle.unit_number || "");
      setGroup(js.vehicle.group_name || "");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    const res = await fetch(`/api/customer/vehicles/${id}`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({
        make,
        model,
        year,
        plate,
        unit_number: unit,
        group_name: group,
      }),
    });

    const js = await res.json();
    if (!res.ok) return alert(js.error);

    router.push(`/customer/vehicles/${id}`);
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!vehicle) return <div className="p-6">Vehicle not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <a href={`/customer/vehicles/${id}`} className="text-sm text-blue-600 underline">
        ← Back to Vehicle
      </a>

      <h1 className="text-3xl font-semibold">Edit Vehicle</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="border p-3 rounded-lg" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make" />
        <input className="border p-3 rounded-lg" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" />
        <input className="border p-3 rounded-lg" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" />
        <input className="border p-3 rounded-lg" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Plate" />
        <input className="border p-3 rounded-lg" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit #" />
        <input className="border p-3 rounded-lg" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Group Name" />
      </div>

      <button
        onClick={save}
        className="w-full py-3 bg-black text-white rounded-xl font-semibold"
      >
        Save Changes
      </button>
    </div>
  );
}
