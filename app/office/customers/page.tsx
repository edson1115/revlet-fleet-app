// app/office/customers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type UUID = string;
type Opt = { id: string; name: string };

type Customer = {
  id: UUID;
  name: string | null;
  company_id: UUID | null;
  location_id: UUID | null;
  account_number: string | null;
  contact_name: string | null;
  contact_phone: string | null;
};

type Vehicle = {
  id: UUID;
  company_id?: UUID | null;
  customer_id: UUID | null;
  unit_number: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
  plate?: string | null;
};

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GET ${url} → ${res.status} ${res.statusText} ${txt}`);
  }
  return res.json() as Promise<T>;
}

async function postJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`POST ${url} → ${res.status} ${res.statusText} ${txt}`);
  }
  return res.json() as Promise<T>;
}

async function putJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PUT ${url} → ${res.status} ${res.statusText} ${txt}`);
  }
  return res.json() as Promise<T>;
}

async function del(url: string) {
  const res = await fetch(url, { method: "DELETE", credentials: "include" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`DELETE ${url} → ${res.status} ${res.statusText} ${txt}`);
  }
}

/** Sort helper: natural-ish by unit number */
function sortByUnit(a: Vehicle, b: Vehicle) {
  return a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true });
}

export default function OfficeCustomersPage() {
  const [customers, setCustomers] = useState<Opt[]>([]);
  const [companies, setCompanies] = useState<Opt[]>([]);
  const [locations, setLocations] = useState<Opt[]>([]);

  const [selectedId, setSelectedId] = useState<UUID | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  // 🔹 Add New Customer modal state
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newAccount, setNewAccount] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newErr, setNewErr] = useState("");

  // 🔹 Vehicles state for the selected customer
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehLoading, setVehLoading] = useState(false);
  const [vehErr, setVehErr] = useState("");

  // 🔹 Add Vehicle modal state
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehSaving, setVehSaving] = useState(false);
  const [formVeh, setFormVeh] = useState<{
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

  // Load base lookups
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cust, comp, loc] = await Promise.all([
          fetchJSON<{ ok: boolean; data: Opt[] }>("/api/lookups?scope=customers"),
          fetchJSON<{ ok: boolean; data: Opt[] }>("/api/lookups?scope=companies"),
          fetchJSON<{ ok: boolean; data: Opt[] }>("/api/lookups?scope=locations"),
        ]);

        if (!mounted) return;
        setCustomers(cust.data ?? []);
        setCompanies(comp.data ?? []); // still useful for edit pane
        setLocations(loc.data ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load lookups.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load selected customer details
  useEffect(() => {
    if (!selectedId) {
      setEditing(null);
      setVehicles([]);
      return;
    }
    let mounted = true;
    (async () => {
      setErr("");
      try {
        const full = await fetchJSON<{ ok: boolean; data: Customer }>(
          `/api/admin/customers/${selectedId}`
        );
        if (!mounted) return;
        setEditing(full.data);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load customer.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  // Load vehicles for selected customer
  useEffect(() => {
    if (!selectedId) return;
    let mounted = true;
    (async () => {
      setVehErr("");
      setVehLoading(true);
      try {
        const { data } = await fetchJSON<{ data: Vehicle[] }>(
          `/api/admin/vehicles?customer_id=${selectedId}`
        );
        if (!mounted) return;
        setVehicles((data ?? []).slice().sort(sortByUnit));
      } catch (e: any) {
        if (!mounted) return;
        setVehErr(e?.message || "Failed to load vehicles.");
      } finally {
        if (mounted) setVehLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  // 🔹 Create new customer (no company dropdown)
  async function createCustomer() {
    try {
      setCreating(true);
      setNewErr("");
      if (!newName.trim()) {
        throw new Error("Customer name is required.");
      }
      const json = await postJSON<{ data: Opt }>(`/api/admin/customers`, {
        name: newName.trim(),
        // company_id omitted → server decides (SUPERADMIN can set; others inherit)
        location_id: newLocation || null,
        account_number: newAccount || null,
        contact_name: newContactName || null,
        contact_phone: newContactPhone || null,
      });

      setToast("Customer created.");
      setCustomers((prev) => [...prev, json.data]);
      setShowNew(false);
      setNewName("");
      setNewLocation("");
      setNewAccount("");
      setNewContactName("");
      setNewContactPhone("");
    } catch (e: any) {
      setNewErr(e?.message || "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  // 🔹 Save edits to existing customer
  async function handleSave() {
    if (!editing?.id) return;
    setSaving(true);
    setErr("");
    setToast("");
    try {
      await putJSON(`/api/admin/customers/${editing.id}`, {
        name: editing.name,
        company_id: editing.company_id,
        location_id: editing.location_id,
        account_number: editing.account_number,
        contact_name: editing.contact_name,
        contact_phone: editing.contact_phone,
      });
      setToast("Customer updated.");
      setCustomers((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, name: editing.name || "" } : c))
      );
    } catch (e: any) {
      setErr(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  // 🔹 Vehicles: create
  async function handleCreateVehicle() {
    if (!selectedId) return;
    try {
      setVehSaving(true);
      setVehErr("");
      if (!formVeh.unit_number.trim()) {
        throw new Error("Unit # is required.");
      }

      const body = {
        customer_id: selectedId,
        unit_number: formVeh.unit_number.trim(),
        year: formVeh.year ? Number(formVeh.year) : null,
        make: formVeh.make || null,
        model: formVeh.model || null,
        vin: formVeh.vin || null,
        plate: formVeh.plate || null,
      };

      const { data } = await postJSON<{ data: Vehicle }>(`/api/admin/vehicles`, body);

      setVehicles((prev) => [...prev, data].sort(sortByUnit));
      setShowAddVehicle(false);
      setFormVeh({ unit_number: "", year: "", make: "", model: "", vin: "", plate: "" });
      setToast("Vehicle added.");
    } catch (e: any) {
      const msg =
        /duplicate key value violates/i.test(String(e?.message))
          ? "A vehicle with that unit number already exists for this customer."
          : e?.message || "Create vehicle failed.";
      setVehErr(msg);
    } finally {
      setVehSaving(false);
    }
  }

  // 🔹 Vehicles: delete
  async function handleDeleteVehicle(id: UUID) {
    try {
      await del(`/api/admin/vehicles?id=${id}`);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      setToast("Vehicle deleted.");
    } catch (e: any) {
      setVehErr(e?.message || "Delete failed.");
    }
  }

  // simple search: avoid mutating the master list permanently
  const [search, setSearch] = useState("");
  const visibleCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers.slice().sort((a, b) => a.name.localeCompare(b.name));
    return customers
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((c) => (c.name || "").toLowerCase().includes(term));
  }, [customers, search]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left pane — list */}
      <div className="w-72 border-r bg-white/60">
        <div className="p-4 flex items-center justify-between">
          <h2 className="font-semibold">Customers</h2>
          <button
            onClick={() => setShowNew(true)}
            className="px-2 py-1 text-xs bg-black text-white rounded-md hover:bg-gray-800"
          >
            + Add
          </button>
        </div>

        <div className="p-2">
          <input
            type="text"
            placeholder="Search…"
            className="w-full border rounded-md px-3 py-1.5 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto h-[calc(100vh-7.5rem)]">
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading…</div>
          ) : visibleCustomers.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No customers.</div>
          ) : (
            visibleCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`px-4 py-2 cursor-pointer text-sm border-b hover:bg-gray-100 ${
                  selectedId === c.id ? "bg-gray-200 font-medium" : ""
                }`}
              >
                {c.name}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right pane — details + vehicles */}
      <div className="flex-1 p-6 overflow-y-auto">
        {err && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 text-red-800 p-3">
            {err}
          </div>
        )}
        {toast && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 text-green-800 p-3">
            {toast}
          </div>
        )}

        {!editing ? (
          <div className="text-sm text-gray-500">Select a customer to view or edit.</div>
        ) : (
          <div className="space-y-8">
            {/* Customer Edit */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Customer Name</label>
                <input
                  value={editing.name ?? ""}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                  }
                  className="border rounded-md px-3 py-2 w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Company</label>
                <select
                  value={editing.company_id ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, company_id: e.target.value || null } : prev
                    )
                  }
                  className="border rounded-md px-3 py-2 w-full text-sm"
                >
                  <option value="">Select company…</option>
                  {companies.map((co) => (
                    <option key={co.id} value={co.id}>
                      {co.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Location</label>
                <select
                  value={editing.location_id ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, location_id: e.target.value || null } : prev
                    )
                  }
                  className="border rounded-md px-3 py-2 w-full text-sm"
                >
                  <option value="">Select location…</option>
                  {locations.map((lo) => (
                    <option key={lo.id} value={lo.id}>
                      {lo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Account #</label>
                <input
                  value={editing.account_number ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, account_number: e.target.value } : prev
                    )
                  }
                  className="border rounded-md px-3 py-2 w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Contact Name</label>
                <input
                  value={editing.contact_name ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, contact_name: e.target.value } : prev
                    )
                  }
                  className="border rounded-md px-3 py-2 w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Contact Phone</label>
                <input
                  value={editing.contact_phone ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, contact_phone: e.target.value } : prev
                    )
                  }
                  className="border rounded-md px-3 py-2 w-full text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-black text-white text-sm disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>

                <button
                  onClick={async () => {
                    if (!editing?.id) return;
                    if (!confirm(`Delete customer "${editing.name}"? This cannot be undone.`))
                      return;
                    try {
                      await del(`/api/admin/customers/${editing.id}`);
                      setToast("Customer deleted.");
                      setCustomers((prev) => prev.filter((c) => c.id !== editing.id));
                      setEditing(null);
                      setSelectedId(null);
                      setVehicles([]);
                    } catch (e: any) {
                      setErr(e?.message || "Delete failed.");
                    }
                  }}
                  className="px-4 py-2 rounded-md border border-red-400 text-red-600 text-sm hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Vehicles for this customer */}
            <section className="rounded-2xl bg-white p-5 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-medium">Vehicles</h2>
                <button
                  className="rounded-xl border px-3 py-1 hover:bg-gray-50"
                  onClick={() => setShowAddVehicle(true)}
                >
                  + Add Vehicle
                </button>
              </div>

              {vehErr && (
                <div className="mb-3 rounded-md border border-red-300 bg-red-50 text-red-800 p-2 text-sm">
                  {vehErr}
                </div>
              )}

              {vehLoading ? (
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
                        <th className="py-2 pr-0 text-right">Actions</th>
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
                              onClick={() => handleDeleteVehicle(v.id)}
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
          </div>
        )}
      </div>

      {/* Add New Customer Modal */}
      {showNew ? (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !creating) setShowNew(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Add New Customer</h2>
              <button
                onClick={() => !creating && setShowNew(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {newErr && (
              <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-2 text-sm">
                {newErr}
              </div>
            )}

            <div className="space-y-3">
              <input
                placeholder="Customer Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border rounded-md px-3 py-2 w-full text-sm"
              />

              <select
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="border rounded-md px-3 py-2 w-full text-sm"
              >
                <option value="">Select location…</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              <input
                placeholder="Account Number (optional)"
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
                className="border rounded-md px-3 py-2 w-full text-sm"
              />

              <input
                placeholder="Contact Name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="border rounded-md px-3 py-2 w-full text-sm"
              />

              <input
                placeholder="Contact Phone"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className="border rounded-md px-3 py-2 w-full text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => !creating && setShowNew(false)}
                className="px-4 py-2 rounded-md border bg-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createCustomer}
                disabled={creating}
                className="px-4 py-2 rounded-md bg-black text-white text-sm disabled:opacity-40"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add Vehicle Modal */}
      {showAddVehicle && selectedId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !vehSaving) setShowAddVehicle(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Vehicle</h3>
              <button
                className="rounded-lg border px-2 py-1"
                onClick={() => !vehSaving && setShowAddVehicle(false)}
              >
                ✕
              </button>
            </div>

            {vehErr && (
              <div className="mb-3 rounded-md border border-red-300 bg-red-50 text-red-800 p-2 text-sm">
                {vehErr}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2">
                <div className="text-sm text-gray-600">Unit #</div>
                <input
                  value={formVeh.unit_number}
                  onChange={(e) => setFormVeh((s) => ({ ...s, unit_number: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="e.g., 6773"
                />
              </label>

              <label>
                <div className="text-sm text-gray-600">Year</div>
                <input
                  value={formVeh.year}
                  onChange={(e) => setFormVeh((s) => ({ ...s, year: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="2022"
                  inputMode="numeric"
                />
              </label>

              <label>
                <div className="text-sm text-gray-600">Make</div>
                <input
                  value={formVeh.make}
                  onChange={(e) => setFormVeh((s) => ({ ...s, make: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="Ford"
                />
              </label>

              <label>
                <div className="text-sm text-gray-600">Model</div>
                <input
                  value={formVeh.model}
                  onChange={(e) => setFormVeh((s) => ({ ...s, model: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="Transit 250"
                />
              </label>

              <label>
                <div className="text-sm text-gray-600">VIN</div>
                <input
                  value={formVeh.vin}
                  onChange={(e) => setFormVeh((s) => ({ ...s, vin: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="1FTYR1Z..."
                />
              </label>

              <label>
                <div className="text-sm text-gray-600">Plate</div>
                <input
                  value={formVeh.plate}
                  onChange={(e) => setFormVeh((s) => ({ ...s, plate: e.target.value }))}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="TTZ-1193"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                className="rounded-xl border px-4 py-2"
                onClick={() => !vehSaving && setShowAddVehicle(false)}
                disabled={vehSaving}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-40"
                onClick={handleCreateVehicle}
                disabled={vehSaving}
              >
                {vehSaving ? "Saving…" : "Save Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
