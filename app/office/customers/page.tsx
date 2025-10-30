// app/office/customers/page.tsx
"use client";

import { useEffect, useState } from "react";

type Opt = { id: string; name: string };

type Customer = {
  id: string;
  name: string | null;
  company_id: string | null;
  location_id: string | null;
  account_number: string | null;
  contact_name: string | null;
  contact_phone: string | null;
};

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GET ${url} → ${res.status} ${res.statusText} ${txt}`);
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

export default function OfficeCustomersPage() {
  const [customers, setCustomers] = useState<Opt[]>([]);
  const [companies, setCompanies] = useState<Opt[]>([]);
  const [locations, setLocations] = useState<Opt[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  // Load selected customer
  useEffect(() => {
    if (!selectedId) {
      setEditing(null);
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

  // 🔹 Create new customer (no company dropdown)
  async function createCustomer() {
    try {
      setCreating(true);
      setNewErr("");
      if (!newName.trim()) {
        throw new Error("Customer name is required.");
      }
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          // company_id: omitted on purpose → backend will set from superadmin/company context
          location_id: newLocation || null,
          account_number: newAccount || null,
          contact_name: newContactName || null,
          contact_phone: newContactPhone || null,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const json = await res.json();
      setToast("Customer created.");
      // append to list so left pane refreshes
      setCustomers((prev) => [...prev, json.data]);
      // close + reset modal
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
            onChange={(e) => {
              const v = e.target.value.toLowerCase();
              setCustomers((prev) =>
                prev
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .filter((c) => c.name.toLowerCase().includes(v))
              );
            }}
          />
        </div>

        <div className="overflow-y-auto h-[calc(100vh-7.5rem)]">
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading…</div>
          ) : customers.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No customers.</div>
          ) : (
            customers.map((c) => (
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

      {/* Right pane — details */}
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
                  setEditing((prev) => (prev ? { ...prev, company_id: e.target.value } : prev))
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
                  setEditing((prev) => (prev ? { ...prev, location_id: e.target.value } : prev))
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
                    const res = await fetch(`/api/admin/customers/${editing.id}`, {
                      method: "DELETE",
                      credentials: "include",
                    });
                    if (!res.ok) {
                      const txt = await res.text();
                      throw new Error(txt);
                    }
                    setToast("Customer deleted.");
                    setCustomers((prev) => prev.filter((c) => c.id !== editing.id));
                    setEditing(null);
                    setSelectedId(null);
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
    </div>
  );
}
