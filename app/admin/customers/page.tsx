"use client";

import { useEffect, useMemo, useState } from "react";

type CustomerRow = {
  id: string;
  email?: string | null;
  role?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  company_id?: string | null;
  location_id?: string | null;
  created_at?: string | null;
};

type Opt = { id: string; label: string };

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function patchJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function deleteJSON<T>(url: string) {
  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [locations, setLocations] = useState<Opt[]>([]);
  const [companies, setCompanies] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // modal state
  const [showEdit, setShowEdit] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CustomerRow>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // load customers + lookups
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const [cust, locs, comps] = await Promise.all([
          fetchJSON<{ rows: CustomerRow[] }>("/api/admin/customers"),
          fetchJSON<{ success: boolean; data: Opt[] }>("/api/lookups?scope=locations"),
          fetchJSON<{ success: boolean; data: Opt[] }>("/api/lookups?scope=companies"),
        ]);

        if (!mounted) return;
        setRows(cust.rows || []);
        setLocations(locs.data || []);
        setCompanies(comps.data || []);
      } catch (e: any) {
        if (mounted) setErr(e?.message || "Failed to load customers.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // derived: filtered list
  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterCompany && r.company_id !== filterCompany) return false;
      if (filterLocation && r.location_id !== filterLocation) return false;

      if (!term) return true;

      const haystack = [
        r.email,
        r.account_name,
        r.account_number,
        r.contact_name,
        r.contact_phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [rows, q, filterCompany, filterLocation]);

  function openEdit(row: CustomerRow) {
    setActiveId(row.id);
    setForm({
      email: row.email || "",
      role: row.role || "CUSTOMER",
      account_name: row.account_name || "",
      account_number: row.account_number || "",
      contact_name: row.contact_name || "",
      contact_phone: row.contact_phone || "",
      location_id: row.location_id || "",
      company_id: row.company_id || "",
    });
    setShowEdit(true);
  }

  function closeEdit() {
    if (saving) return;
    setShowEdit(false);
    setActiveId(null);
  }

  function setField<K extends keyof CustomerRow>(key: K, value: CustomerRow[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveEdit() {
    if (!activeId) return;
    try {
      setSaving(true);
      setErr("");
      setToast("");

      const payload = {
        account_name: form.account_name?.trim() || null,
        account_number: form.account_number?.trim() || null,
        contact_name: form.contact_name?.trim() || null,
        contact_phone: form.contact_phone?.trim() || null,
        location_id: form.location_id?.trim() || null,
        company_id: form.company_id?.trim() || null,
      };

      const resp = await patchJSON<{ ok: boolean; data: CustomerRow[] }>(
        `/api/admin/customers/${activeId}`,
        payload
      );

      const updated = resp.data?.[0];
      if (updated) {
        setRows((prev) =>
          prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
        );
      }

      setToast("Customer updated.");
      setShowEdit(false);
      setActiveId(null);
    } catch (e: any) {
      setErr(e?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(id: string) {
    if (!id) return;
    if (!window.confirm("Delete this customer (and their auth user)? This cannot be undone.")) {
      return;
    }
    try {
      setDeletingId(id);
      setErr("");
      setToast("");
      await deleteJSON(`/api/admin/customers/${id}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setToast("Customer deleted.");
    } catch (e: any) {
      setErr(e?.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Customer Management</h1>
        <p className="text-xs text-gray-500">
          Superadmin / Admin only. Edit or delete customer profiles.
        </p>
      </div>

      {/* alerts */}
      {err ? (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
          {err}
        </div>
      ) : null}

      {toast ? (
        <div className="rounded-md border border-green-300 bg-green-50 text-green-800 p-3 text-sm">
          {toast}
        </div>
      ) : null}

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-3 items-center border rounded-xl p-3 bg-gray-50">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full md:w-64"
          placeholder="Search email, account, contact…"
          aria-label="Search customers"
        />

        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>

        {(q || filterCompany || filterLocation) ? (
          <button
            onClick={() => {
              setQ("");
              setFilterCompany("");
              setFilterLocation("");
            }}
            className="text-xs px-3 py-2 rounded-md border bg-white"
          >
            Clear filters
          </button>
        ) : null}

        <span className="ml-auto text-xs text-gray-500">
          Showing {filteredRows.length} of {rows.length}
        </span>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading customers…</div>
      ) : filteredRows.length === 0 ? (
        <div className="text-sm text-gray-500">No customers matched your filters.</div>
      ) : (
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Account</th>
                <th className="py-2 px-3">Contact</th>
                <th className="py-2 px-3">Location</th>
                <th className="py-2 px-3">Company</th>
                <th className="py-2 px-3 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50/60">
                  <td className="py-2 px-3">
                    <div className="font-medium">{r.email || "—"}</div>
                    <div className="text-xs text-gray-500">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : null}
                    </div>
                  </td>
                  <td className="py-2 px-3">{r.role || "—"}</td>
                  <td className="py-2 px-3">
                    <div>{r.account_name || "—"}</div>
                    {r.account_number ? (
                      <div className="text-xs text-gray-500">#{r.account_number}</div>
                    ) : null}
                  </td>
                  <td className="py-2 px-3">
                    <div>{r.contact_name || "—"}</div>
                    <div className="text-xs text-gray-500">
                      {r.contact_phone || ""}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {r.location_id ? (
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {r.location_id}
                      </code>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {r.company_id ? (
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {r.company_id}
                      </code>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="px-3 py-1 rounded-md border bg-white text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCustomer(r.id)}
                        disabled={deletingId === r.id}
                        className="px-3 py-1 rounded-md border bg-red-600 text-white text-xs disabled:opacity-40"
                      >
                        {deletingId === r.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) closeEdit();
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Customer</h2>
              <button
                onClick={closeEdit}
                className="px-3 py-1 rounded-md border"
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="block mb-1">Account name</span>
                <input
                  value={form.account_name ?? ""}
                  onChange={(e) => setField("account_name", e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="e.g. FedEx – New Braunfels"
                />
              </label>

              <label className="block text-sm">
                <span className="block mb-1">Account #</span>
                <input
                  value={form.account_number ?? ""}
                  onChange={(e) => setField("account_number", e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="e.g. 44518"
                />
              </label>

              <label className="block text-sm">
                <span className="block mb-1">Contact name</span>
                <input
                  value={form.contact_name ?? ""}
                  onChange={(e) => setField("contact_name", e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="e.g. Gabe M."
                />
              </label>

              <label className="block text-sm">
                <span className="block mb-1">Contact phone</span>
                <input
                  value={form.contact_phone ?? ""}
                  onChange={(e) => setField("contact_phone", e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="e.g. 210-555-0199"
                />
              </label>

              {/* location dropdown */}
              <label className="block text-sm">
                <span className="block mb-1">Location</span>
                <select
                  value={form.location_id ?? ""}
                  onChange={(e) => setField("location_id", e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="">Select…</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* company dropdown */}
              <label className="block text-sm">
                <span className="block mb-1">Company</span>
                <select
                  value={form.company_id ?? ""}
                  onChange={(e) => setField("company_id", e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="">Select…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm md:col-span-2 opacity-60">
                <span className="block mb-1">Email (locked)</span>
                <input
                  value={form.email ?? ""}
                  disabled
                  className="border rounded-md px-3 py-2 w-full bg-gray-100"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeEdit}
                className="px-4 py-2 rounded-md border bg-white"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-md border bg-black text-white disabled:opacity-40"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
