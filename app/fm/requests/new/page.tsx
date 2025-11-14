// app/fm/requests/new/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocationScope } from "@/lib/useLocationScope";

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
  created_at?: string | null;
};

export default function CreateRequestPage() {
  const router = useRouter();

  // Global scope (gear shift)
  const {
    locationId: scopedLocationId,
    setLocationId: setScopedLocationId,
  } = useLocationScope();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Who am I? (to know if we’re SUPERADMIN / ADMIN)
  const [role, setRole] = useState<string>("VIEWER");

  // Lookups
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Selections (form state)
  const [locationId, setFormLocationId] = useState<UUID | "">("");
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

  // Only disable Add Vehicle if no customer selected
  const addVehicleDisabled = useMemo(() => !customerId, [customerId]);

  const isSuperOrAdmin =
    role === "SUPERADMIN" || role === "ADMIN";

  // Fetch role so we know whether to show the Location dropdown
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const js = await res.json();
        const rawRole =
          js?.me?.role ??
          js?.role ??
          "VIEWER";
        if (!live) return;
        setRole(String(rawRole).toUpperCase());
      } catch {
        // ignore, default VIEWER
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // Keep form location in sync with scoped location when we *have* a scope
  useEffect(() => {
    if (scopedLocationId && scopedLocationId !== locationId) {
      setFormLocationId(scopedLocationId as UUID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedLocationId]);

  // Load Locations on mount
  useEffect(() => {
    (async () => {
      setLoadingLookups(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/lookups?type=locations", {
          credentials: "include",
        });
        const js = await res.json();
        const list = Array.isArray(js) ? js : js.data ?? js.rows ?? [];
        if (!Array.isArray(list))
          throw new Error("Bad payload from /api/lookups?type=locations");
        const rows: Location[] = list.map((r: any) => ({
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
        const res = await fetch(
          `/api/lookups?type=customers&location_id=${locationId}`,
          {
            credentials: "include",
          }
        );
        const js = await res.json();
        const list = Array.isArray(js) ? js : js.data ?? js.rows ?? [];
        if (!Array.isArray(list))
          throw new Error("Bad payload from /api/lookups?type=customers");
        const rows: Customer[] = list.map((r: any) => ({
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
        const rows: Vehicle[] = Array.isArray(js)
          ? js
          : (js?.data ?? js?.rows ?? []);
        const sorted = [...rows].sort((a: Vehicle, b: Vehicle) => {
          const ta = a.created_at
            ? new Date(a.created_at).getTime()
            : 0;
          const tb = b.created_at
            ? new Date(b.created_at).getTime()
            : 0;
          return tb - ta;
        });
        setVehicles(sorted);
      } catch (e: any) {
        setErrorMsg(e?.message || "Failed to load vehicles");
      }
    })();
  }, [customerId]);

  // Current location name for display
  const currentLocationName =
    locations.find((l) => l.id === locationId)?.name ?? "";

  // Create Request → POST to /api/requests
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!locationId || !customerId || !vehicleId || !service.trim()) {
      setErrorMsg(
        "Select Location, Customer, Vehicle, and provide a Service."
      );
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
          fmc: fmc || null, // server maps fmc_text with enum fallback
          priority, // harmless if server ignores it
          mileage: mileage ? Number(mileage) : null,
          po: po || null,
          notes: notes || null,
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
      const payload: any = {
        customer_id: customerId,
        plate: avPlate.trim() || null,
        vin: avVin.trim() || null,
        year: avYear || null,
        make: avMake.trim() || null,
        model: avModel.trim() || null,
      };
      if (avUnit.trim()) payload.unit_number = avUnit.trim();

      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to add vehicle");

      const created: Vehicle = js;
      setVehicles((prev) => [created, ...prev]);
      setVehicleId(created.id);

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

          {isSuperOrAdmin ? (
            // SUPERADMIN / ADMIN → read-only, driven by header LocationSwitcher
            <div className="rounded-lg border px-3 py-2 bg-gray-50 text-sm">
              {currentLocationName || "Select a location from the header"}
              {!currentLocationName && (
                <p className="mt-1 text-xs text-gray-500">
                  Use the Location selector in the top bar to choose a market.
                </p>
              )}
            </div>
          ) : (
            // Other roles → keep dropdown for now
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={locationId}
              onChange={(e) => {
                const v = e.target.value as UUID;
                setFormLocationId(v);
                // For non-admin roles, we can still push this into scope
                if (v) {
                  setScopedLocationId(v);
                }
              }}
              disabled={loadingLookups}
            >
              <option value="">Select a location…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
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
            <p className="mt-1 text-xs text-gray-500">
              Pick a Location first.
            </p>
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
              title={
                !customerId ? "Select a Customer first" : "Add a new vehicle"
              }
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
            {vehicles.map((v) => {
              const main =
                v.unit_number ||
                [v.year || "", v.make || "", v.model || ""]
                  .filter(Boolean)
                  .join(" ")
                  .trim() ||
                v.vin ||
                v.plate ||
                "Vehicle";
              const extras = [v.vin, v.plate].filter(Boolean).join(" • ");
              return (
                <option key={v.id} value={v.id}>
                  {main}
                  {extras ? ` • ${extras}` : ""}
                </option>
              );
            })}
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
                    setAvYear(
                      e.target.value ? Number(e.target.value) : undefined
                    )
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
