// app/office/customers/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type UUID = string;

type Vehicle = {
  id: UUID;
  customer_id: UUID | null;
  company_id?: UUID | null;
  unit_number: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
  plate?: string | null;
};

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export default function CustomerDetailPage() {
  const { id: customerId } = useParams<{ id: string }>();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    unit_number: string;
    year: string;
    make: string;
    model: string;
    vin: string;
    plate: string;
  }>({
    unit_number: "",
    year: "",
    make: "",
    model: "",
    vin: "",
    plate: "",
  });

  useEffect(() => {
    if (!customerId) return;
    const run = async () => {
      setLoading(true);
      try {
        const { data } = await fetchJSON<{ data: Vehicle[] }>(
          `/api/admin/vehicles?customer_id=${customerId}`
        );
        // Sort by unit number for consistent UX
        data.sort((a, b) =>
          a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true })
        );
        setVehicles(data);
      } catch (e: any) {
        alert(`Failed to load vehicles: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [customerId]);

  const onCreateVehicle = async () => {
    if (!customerId) return;
    if (!form.unit_number.trim()) {
      alert("Unit # is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        customer_id: String(customerId),
        unit_number: form.unit_number.trim(),
        year: form.year ? Number(form.year) : null,
        make: form.make || null,
        model: form.model || null,
        vin: form.vin || null,
        plate: form.plate || null,
      };

      const { data } = await fetchJSON<{ data: Vehicle }>(`/api/admin/vehicles`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setVehicles((prev) =>
        [...prev, data].sort((a, b) =>
          a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true })
        )
      );
      setShowAdd(false);
      setForm({ unit_number: "", year: "", make: "", model: "", vin: "", plate: "" });
      alert("Vehicle added");
    } catch (e: any) {
      // Friendly duplicate message fallback (matches Postgres unique constraint wording)
      const msg =
        /duplicate key value violates/i.test(String(e?.message))
          ? "A vehicle with that unit number already exists for this customer."
          : e?.message || "Failed to add vehicle";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDeleteVehicle = async (id: string) => {
    try {
      await fetchJSON(`/api/admin/vehicles?id=${id}`, { method: "DELETE" });
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      alert("Vehicle deleted");
    } catch (e: any) {
      alert(`Failed to delete vehicle: ${e.message}`);
    }
  };

  if (!customerId) {
    return <div className="p-6 text-red-600">Missing customer id.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <button
          className="text-sm text-blue-600 underline"
          onClick={() => router.push("/office/customers")}
        >
          ← Back to Customers
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-2">Customer</h1>
      <p className="text-sm text-gray-500 mb-8">ID: {String(customerId)}</p>

      {/* Vehicles Section */}
      <section className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Vehicles</h2>
          <button
            className="rounded-xl border px-3 py-1 hover:bg-gray-50"
            onClick={() => setShowAdd(true)}
          >
            + Add Vehicle
          </button>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : vehicles.length === 0 ? (
          <div className="text-gray-500 italic">No vehicles yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Unit #</th>
                  <th className="py-2 pr-4">Year</th>
                  <th className="py-2 pr-4">Make</th>
                  <th className="py-2 pr-4">Model</th>
                  <th className="py-2 pr-4">VIN</th>
                  <th className="py-2 pr-4">Plate</th>
                  <th className="py-2 pr-0"></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="py-2 pr-4 font-medium">{v.unit_number}</td>
                    <td className="py-2 pr-4">{v.year ?? ""}</td>
                    <td className="py-2 pr-4">{v.make ?? ""}</td>
                    <td className="py-2 pr-4">{v.model ?? ""}</td>
                    <td className="py-2 pr-4">{v.vin ?? ""}</td>
                    <td className="py-2 pr-4">{v.plate ?? ""}</td>
                    <td className="py-2 pr-0 text-right">
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => onDeleteVehicle(v.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add Vehicle Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Vehicle</h3>
              <button
                className="rounded-lg border px-2 py-1"
                onClick={() => setShowAdd(false)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2">
                <div className="text-sm text-gray-600">Unit #</div>
                <input
                  value={form.unit_number}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, unit_number: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="e.g., 6773"
                />
              </label>

              <label>
                <div className="text-sm text-gray-600">Year</div>
                <input
                  value={form.year}
                  onChange={(e) => setForm((s) => ({ ...s, year: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="2022"
                  inputMode="numeric"
                />
              </label>

              <label>
                <div className="text-sm text-gray-600">Make</div>
                <input
                  value={form.make}
                  onChange={(e) => setForm((s) => ({ ...s, make: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="Ford"
                />
              </label>

              <label>
                <div className="text-sm text-gray-600">Model</div>
                <input
                  value={form.model}
                  onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="Transit 250"
                />
              </label>

              <label>
                <div className="text-sm text-gray-600">VIN</div>
                <input
                  value={form.vin}
                  onChange={(e) => setForm((s) => ({ ...s, vin: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="1FTYR1Z..."
                />
              </label>

              <label>
                <div className="text-sm text-gray-600">Plate</div>
                <input
                  value={form.plate}
                  onChange={(e) => setForm((s) => ({ ...s, plate: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="TTZ-1193"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                className="rounded-xl border px-4 py-2"
                onClick={() => setShowAdd(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-black px-4 py-2 text-white"
                onClick={onCreateVehicle}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
