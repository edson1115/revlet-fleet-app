// app/fm/requests/new/page.tsx
"use client";

import RequestsViewer from "./RequestsViewer";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Id = string;

type Vehicle = {
  id: Id;
  year: number | null;
  make: string;
  model: string;
  plate?: string | null;
  unit_number?: string | null;
};

type Location = { id: Id; name: string }; // name = Market (San Antonio, Dallas, etc.)
type Customer = { id: Id; name: string; market?: string | null };

type FormState = {
  vehicle_id: Id | "";
  location_id: Id | ""; // we store the market row id, but use its name to filter customers
  customer_id: Id | "";
  service: string;
  fmc: string | "";
  mileage: number | "";
  po: string;
  notes: string;
};

export default function NewServiceRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const vehicleFromUrl = searchParams.get("vehicle_id") || "";
  const addedVehicle = searchParams.get("added_vehicle") === "1";
  const success = searchParams.get("success") === "1";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fmcOptions, setFmcOptions] = useState<string[]>([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    vehicle_id: "",
    location_id: "",
    customer_id: "",
    service: "",
    fmc: "",
    mileage: "",
    po: "",
    notes: "",
  });

  const [isPending, startTransition] = useTransition();

  // Resolve selected market label from selected location_id
  const selectedMarket = useMemo(() => {
    const loc = locations.find((l) => l.id === form.location_id);
    return loc?.name || "";
  }, [locations, form.location_id]);

  // Initial loads
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [vRes, lRes, fmcRes] = await Promise.all([
          fetch("/api/vehicles", { cache: "no-store" }),
          fetch("/api/lookups?scope=locations", { cache: "no-store" }),
          fetch("/api/lookups?scope=fmc", { cache: "no-store" }),
        ]);
        const [v, l, fmc] = await Promise.all([vRes.json(), lRes.json(), fmcRes.json()]);
        if (!mounted) return;

        const vRows: Vehicle[] =
          v?.rows?.map((x: any) => ({
            id: x.id,
            year: x.year ?? null,
            make: x.make ?? "",
            model: x.model ?? "",
            plate: x.plate ?? null,
            unit_number: x.unit_number ?? null,
          })) ?? [];

        setVehicles(vRows);
        setLocations(l?.rows ?? []);
        setFmcOptions((fmc?.rows ?? []).map((r: any) => r.label as string));

        // Preselect vehicle if returning from Add Vehicle
        if (vehicleFromUrl && vRows.some((x) => x.id === vehicleFromUrl)) {
          setForm((s) => ({ ...s, vehicle_id: vehicleFromUrl as Id }));
        }

        // If there is only one market, preselect it
        if ((l?.rows ?? []).length === 1) {
          const only = l.rows[0] as Location;
          setForm((s) => ({ ...s, location_id: only.id as Id }));
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load vehicles/locations.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [vehicleFromUrl]);

  // Load customers when market selection changes
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!selectedMarket) {
          setCustomers([]);
          setForm((s) => ({ ...s, customer_id: "" }));
          return;
        }
        const res = await fetch(
          `/api/lookups?scope=customers&market=${encodeURIComponent(selectedMarket)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!active) return;

        setCustomers(json?.rows ?? []);

        if ((json?.rows ?? []).length === 1) {
          setForm((s) => ({ ...s, customer_id: json.rows[0].id as Id }));
        } else {
          const stillValid = (json?.rows ?? []).some((c: Customer) => c.id === form.customer_id);
          if (!stillValid) setForm((s) => ({ ...s, customer_id: "" }));
        }
      } catch (e) {
        console.error(e);
        setCustomers([]);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarket]);

  function vehicleLabel(v: Vehicle) {
    return [v.year || "", v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!form.vehicle_id || !form.location_id || !form.customer_id || !form.service) {
      setError("Please fill in all required fields.");
      return;
    }

    const payload = {
      vehicle_id: form.vehicle_id,
      location_id: form.location_id,
      customer_id: form.customer_id,
      service: form.service.trim(),
      fmc: form.fmc || null,
      mileage: form.mileage === "" ? null : Number(form.mileage),
      po: form.po.trim() || null,
      notes: form.notes.trim() || null,
      status: "NEW",
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        router.replace("/office/queue?success=1");
      } catch (err: any) {
        console.error(err);
        setError(typeof err?.message === "string" ? err.message : "Failed to create request.");
      }
    });
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-6">
        {/* LEFT: your current form, unchanged */}
        <div className="md:col-span-7 lg:col-span-8">
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Create Service Request</h1>

            {(success || addedVehicle) && (
              <div className="rounded border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">
                {addedVehicle ? "Vehicle saved. It’s now available in the list." : "Request created successfully."}
              </div>
            )}

            {error && (
              <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vehicle */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm mb-1">Vehicle *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.vehicle_id}
                    onChange={(e) => setForm((s) => ({ ...s, vehicle_id: e.target.value as Id }))}
                    required
                  >
                    <option value="">Select vehicle…</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {vehicleLabel(v)}
                      </option>
                    ))}
                  </select>
                </div>
                <a
                  href={`/vehicles/new?return=${encodeURIComponent("/fm/requests/new")}`}
                  className="px-3 py-2 rounded border whitespace-nowrap"
                >
                  + Add vehicle
                </a>
              </div>

              {/* Location = Market */}
              <div>
                <label className="block text-sm mb-1">Location (Market) *</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.location_id}
                  onChange={(e) => setForm((s) => ({ ...s, location_id: e.target.value as Id }))}
                  required
                >
                  <option value="">Select location…</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">Selected market: {selectedMarket || "—"}</div>
              </div>

              {/* Customer (filtered by Market) */}
              <div>
                <label className="block text-sm mb-1">Customer *</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.customer_id}
                  onChange={(e) => setForm((s) => ({ ...s, customer_id: e.target.value as Id }))}
                  required
                  disabled={!selectedMarket}
                >
                  <option value="">{selectedMarket ? "Select customer…" : "Choose a market first…"}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  Loaded {customers.length} customer{customers.length === 1 ? "" : "s"} for {selectedMarket || "—"}
                </div>
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm mb-1">Service *</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Oil Change, A/C Diagnostic, etc."
                  value={form.service}
                  onChange={(e) => setForm((s) => ({ ...s, service: e.target.value }))}
                  required
                />
              </div>

              {/* FMC */}
              <div>
                <label className="block text-sm mb-1">Fleet Management Company (optional)</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.fmc}
                  onChange={(e) => setForm((s) => ({ ...s, fmc: e.target.value }))}
                >
                  <option value="">Select FMC…</option>
                  {fmcOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mileage */}
              <div>
                <label className="block text-sm mb-1">Mileage (optional)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  placeholder="72345"
                  value={form.mileage}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      mileage: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
              </div>

              {/* PO */}
              <div>
                <label className="block text-sm mb-1">PO (optional)</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="PO12345"
                  value={form.po}
                  onChange={(e) => setForm((s) => ({ ...s, po: e.target.value }))}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm mb-1">Notes (optional)</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  placeholder="Any additional context for the technician or office..."
                  value={form.notes}
                  onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded bg-black text-white hover:opacity-80 disabled:opacity-60"
                >
                  {isPending ? "Saving…" : "Create request"}
                </button>
                <a href="/" className="px-4 py-2 rounded border">
                  Cancel
                </a>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Live viewer */}
        <div className="md:col-span-5 lg:col-span-4">
          <RequestsViewer />
        </div>
      </div>
    </div>
  );
}
