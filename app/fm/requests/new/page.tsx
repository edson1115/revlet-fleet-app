// app/fm/requests/new/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeRole, permsFor } from "@/lib/permissions";


type UUID = string;

type Location = { id: UUID; name: string };
type Customer = { id: UUID; name: string };
type Vehicle = {
  id: UUID;
  unit_number: string | null;
  plate?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
};

export default function CreateRequestPage() {
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Lookups
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Selections
  const [locationId, setLocationId] = useState<UUID | "">("");
  const [customerId, setCustomerId] = useState<UUID | "">("");
  const [vehicleId, setVehicleId] = useState<UUID | "">("");

  // Request fields (align with /api/requests POST)
  const [service, setService] = useState("Oil Change");
  const [fmc, setFmc] = useState("Enterprise Fleet");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [mileage, setMileage] = useState<string>("");
  const [po, setPo] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Add Vehicle modal
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [avUnit, setAvUnit] = useState("");
  const [avPlate, setAvPlate] = useState("");
  const [avVin, setAvVin] = useState("");
  const [avYear, setAvYear] = useState<number | undefined>(undefined);
  const [avMake, setAvMake] = useState("");
  const [avModel, setAvModel] = useState("");

  // NOW: only disable if we don't have a customer.
  const addVehicleDisabled = useMemo(() => !customerId, [customerId]);

  // Load Locations on mount
  useEffect(() => {
    (async () => {
      setLoadingLookups(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/lookups?scope=locations", { credentials: "include" });
        const js = await res.json();
        if (!res.ok || !js?.data) throw new Error(js?.error || "Failed to load locations");

        const rows: Location[] = (js.data || []).map((r: any) => ({
          id: r.id,
          name: r.name ?? r.label,
        }));
        setLocations(rows);
      } catch (e: any) {
        setErrorMsg(e?.message || "Failed to load locations");
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, []);

  // When Location changes → load Customers for that location
  useEffect(() => {
    (async () => {
      setCustomers([]);
      setCustomerId("");
      setVehicles([]);
      setVehicleId("");

      if (!locationId) return;

      setErrorMsg(null);
      try {
        const res = await fetch(`/api/lookups?scope=customers&location=${locationId}`, {
          credentials: "include",
        });
        const js = await res.json();
        if (!res.ok || !js?.data) throw new Error(js?.error || "Failed to load customers");

        const rows: Customer[] = (js.data || []).map((r: any) => ({
          id: r.id,
          name: r.name ?? r.label,
        }));
        setCustomers(rows);
      } catch (e: any) {
        setErrorMsg(e?.message || "Failed to load customers");
      }
    })();
  }, [locationId]);

  // When Customer changes → load Vehicles for that customer
  useEffect(() => {
    (async () => {
      setVehicles([]);
      setVehicleId("");
      if (!customerId) return;

      setErrorMsg(null);
      try {
        const res = await fetch(`/api/vehicles?customer_id=${customerId}`, {
          credentials: "include",
        });
        const js = await res.json();
        // our /api/vehicles sometimes returns array, sometimes {data:[]}
        const rows: Vehicle[] = Array.isArray(js)
          ? js
          : (js?.data ?? js?.rows ?? []);
        // newest first if created_at is present (some rows in your screenshot are like that)
        const sorted = [...rows].sort((a: any, b: any) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });
        setVehicles(sorted);
      } catch (e: any) {
        setErrorMsg(e?.message || "Failed to load vehicles");
      }
    })();
  }, [customerId]);

  // Create Request → POST to /api/requests
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!locationId || !customerId || !vehicleId || !service.trim()) {
      setErrorMsg("Select Location, Customer, Vehicle, and provide a Service.");
      return;
    }

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vehicle_id: vehicleId,
          location_id: locationId,
          customer_id: customerId,
          service,
          fmc: fmc || null,          // will go through now
          priority,
          mileage: mileage ? Number(mileage) : null,
          po: po || null,
          notes: notes || null,       // will land in service_requests.notes
        }),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to create request");

      router.push("/office/queue");
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to create request");
    }
  };

  // Add Vehicle (modal)
  const onAddVehicle = async () => {
    if (!customerId) return;
    setErrorMsg(null);
    try {
      // build payload depending on whether unit is present
      const payload: any = {
        customer_id: customerId,
        plate: avPlate.trim() || null,
        vin: avVin.trim() || null,
        year: avYear || null,
        make: avMake.trim() || null,
        model: avModel.trim() || null,
      };
      if (avUnit.trim()) {
        // if user DID provide a unit, send it
        payload.unit_number = avUnit.trim();
      }
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to add vehicle");

      const created: Vehicle = js;
      setVehicles((prev) => {
        // put newest on top
        const next = [created, ...prev];
        return next;
      });
      setVehicleId(created.id);

      // reset modal
      setShowAddVehicle(false);
      setAvUnit("");
      setAvPlate("");
      setAvVin("");
      setAvYear(undefined);
      setAvMake("");
      setAvModel("");
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to add vehicle");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Create Service Request</h1>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value as UUID)}
            disabled={loadingLookups}
          >
            <option value="">Select a location…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Customer */}
        <div>
          <label className="block text-sm font-medium mb-1">Customer</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value as UUID)}
            disabled={!locationId}
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {!locationId && (
            <p className="mt-1 text-xs text-gray-500">Pick a Location first.</p>
          )}
        </div>

        {/* Vehicle + Add Vehicle */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium mb-1">Vehicle</label>
            <button
              type="button"
              className="text-sm underline"
              onClick={() => setShowAddVehicle(true)}
              disabled={!customerId}
              title={!customerId ? "Select a Customer first" : "Add a new vehicle"}
            >
              + Add Vehicle
            </button>
          </div>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value as UUID)}
            disabled={!customerId}
          >
            <option value="">Select a vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {/* prefer unit_number if present, else fall back to Y/M/M/plate/VIN */}
                {v.unit_number
                  ? v.unit_number
                  : [
                      v.year || "",
                      v.make || "",
                      v.model || "",
                      v.plate ? `(${v.plate})` : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                {/* extra info */}
                {v.year ? ` • ${v.year}` : ""}
                {v.make ? ` ${v.make}` : ""}
                {v.model ? ` ${v.model}` : ""}
                {v.vin ? ` • ${v.vin}` : ""}
                {v.plate ? ` • ${v.plate}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Service details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Service</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Oil Change"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">FMC</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={fmc}
              onChange={(e) => setFmc(e.target.value)}
              placeholder="Enterprise Fleet"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "NORMAL" | "URGENT")
              }
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Mileage</label>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="e.g. 72401"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">PO</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={po}
              onChange={(e) => setPo(e.target.value)}
              placeholder="(optional)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything the Office/Tech should know?"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={!locationId || !customerId || !vehicleId || !service.trim()}
          >
            Create Request
          </button>
        </div>
      </form>

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Vehicle</h2>
              <button
                className="text-sm text-gray-600"
                onClick={() => setShowAddVehicle(false)}
              >
                Close
              </button>
            </div>

            {!customerId && (
              <p className="mt-2 text-sm text-red-600">
                Select a Customer before adding a vehicle.
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Unit # (optional)
                </label>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={avUnit}
                  onChange={(e) => setAvUnit(e.target.value)}
                  placeholder="e.g. VAN-101 (leave blank if unknown)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Plate</label>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={avPlate}
                  onChange={(e) => setAvPlate(e.target.value)}
                  placeholder="(optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">VIN</label>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={avVin}
                  onChange={(e) => setAvVin(e.target.value)}
                  placeholder="(optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <input
                  type="number"
                  className="w-full rounded-lg border px-3 py-2"
                  value={avYear ?? ""}
                  onChange={(e) =>
                    setAvYear(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Make</label>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={avMake}
                  onChange={(e) => setAvMake(e.target.value)}
                  placeholder="Ford"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={avModel}
                  onChange={(e) => setAvModel(e.target.value)}
                  placeholder="Transit 250"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="rounded-lg border px-4 py-2"
                onClick={() => setShowAddVehicle(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                onClick={onAddVehicle}
                disabled={addVehicleDisabled}
                title={
                  addVehicleDisabled
                    ? "Select a customer first"
                    : "Add vehicle"
                }
              >
                Save Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
