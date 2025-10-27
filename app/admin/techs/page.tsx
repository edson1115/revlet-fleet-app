// app/admin/techs/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toaster";

type UUID = string;
type Tech = {
  id: UUID;
  full_name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at?: string;
};

export default function TechniciansAdminPage() {
  const { push } = useToast();

  const [rows, setRows] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<"all" | "active">("active");

  const [nName, setNName] = useState("");
  const [nPhone, setNPhone] = useState("");
  const [nEmail, setNEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const [editId, setEditId] = useState<UUID | null>(null);
  const [eName, setEName] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = filterActive === "active" ? "?active=1" : "";
      const res = await fetch(`/api/techs${qs}`, { credentials: "include" });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to load technicians");
      const list: Tech[] = Array.isArray(js?.rows) ? js.rows : [];
      setRows(list);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterActive]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nName.trim()) {
      push("Name is required", { kind: "error" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/techs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: nName.trim(), phone: nPhone.trim() || null, email: nEmail.trim() || null }),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to create");
      setNName(""); setNPhone(""); setNEmail("");
      push("Technician added");
      await load();
    } catch (e: any) {
      push(e?.message || "Failed to create", { kind: "error" });
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (t: Tech) => {
    setEditId(t.id);
    setEName(t.full_name || "");
    setEPhone(t.phone || "");
    setEEmail(t.email || "");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEName(""); setEPhone(""); setEEmail("");
  };

  const saveEdit = async (id: UUID) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/techs/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: eName.trim() || null,
          phone: ePhone.trim() || null,
          email: eEmail.trim() || null,
        }),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to save");
      push("Saved");
      cancelEdit();
      await load();
    } catch (e: any) {
      push(e?.message || "Failed to save", { kind: "error" });
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (id: UUID, active: boolean) => {
    try {
      setRows((prev) => prev.map((t) => (t.id === id ? { ...t, active } : t)));
      const res = await fetch(`/api/techs/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to update");
      push(active ? "Activated" : "Deactivated");
      if (filterActive === "active" && !active) {
        setRows((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e: any) {
      push(e?.message || "Failed to update", { kind: "error" });
      await load();
    }
  };

  const onDelete = async (id: UUID) => {
    if (!confirm("Delete this technician? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/techs/${id}`, { method: "DELETE", credentials: "include" });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to delete");
      push("Deleted");
      await load();
    } catch (e: any) {
      push(e?.message || "Failed to delete", { kind: "error" });
    }
  };

  const visible = useMemo(() => rows, [rows]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Technicians</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm">Filter:</label>
          <select
            className="rounded-lg border px-2 py-1 text-sm"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
          >
            <option value="active">Active</option>
            <option value="all">All</option>
          </select>
          <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <form onSubmit={onCreate} className="rounded-2xl border p-4 bg-white shadow-sm">
        <h2 className="font-semibold mb-3">Add Technician</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Full name" value={nName} onChange={(e) => setNName(e.target.value)} />
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Phone (optional)" value={nPhone} onChange={(e) => setNPhone(e.target.value)} />
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Email (optional)" value={nEmail} onChange={(e) => setNEmail(e.target.value)} />
        </div>
        <div className="mt-3">
          <button type="submit" className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50" disabled={creating}>
            {creating ? "Adding…" : "Add"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Phone</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Active</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3 text-gray-500" colSpan={5}>Loading…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td className="px-3 py-3 text-gray-500" colSpan={5}>No technicians.</td></tr>
            ) : (
              visible.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2">
                    {editId === t.id ? (
                      <input className="w-full rounded-lg border px-2 py-1" value={eName} onChange={(e) => setEName(e.target.value)} />
                    ) : (
                      t.full_name
                    )}
                  </td>
                  <td className="px-3 py-2">{editId === t.id ? (
                    <input className="w-full rounded-lg border px-2 py-1" value={ePhone} onChange={(e) => setEPhone(e.target.value)} />
                  ) : (t.phone || "—")}</td>
                  <td className="px-3 py-2">{editId === t.id ? (
                    <input className="w-full rounded-lg border px-2 py-1" value={eEmail} onChange={(e) => setEEmail(e.target.value)} />
                  ) : (t.email || "—")}</td>
                  <td className="px-3 py-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={t.active} onChange={(e) => setActive(t.id, e.target.checked)} />
                      <span>{t.active ? "Active" : "Inactive"}</span>
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    {editId === t.id ? (
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-black px-3 py-1 text-white disabled:opacity-50" onClick={() => saveEdit(t.id)} disabled={saving}>
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button className="rounded-lg border px-3 py-1" onClick={cancelEdit}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button className="rounded-lg border px-3 py-1" onClick={() => startEdit(t)}>Edit</button>
                        <button className="rounded-lg border px-3 py-1" onClick={() => onDelete(t.id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
