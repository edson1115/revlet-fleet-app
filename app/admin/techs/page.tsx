"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toaster";

type UUID = string;
type Tech = {
  id: UUID;
  // ✅ Aligning with API 'name' field
  name: string; 
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
      
      // ✅ Ensure we handle the 'rows' array from JSON
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
        body: JSON.stringify({ name: nName.trim(), phone: nPhone.trim() || null, email: nEmail.trim() || null }),
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
    setEName(t.name || "");
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
      const res = await fetch(`/api/techs?id=${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eName.trim() || null,
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
      const res = await fetch(`/api/techs?id=${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to update");
      push(active ? "Activated" : "Deactivated");
    } catch (e: any) {
      push(e?.message || "Failed to update", { kind: "error" });
      await load();
    }
  };

  const onDelete = async (id: UUID) => {
    if (!confirm("Delete this technician? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/techs?id=${id}`, { method: "DELETE", credentials: "include" });
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
    <div className="max-w-6xl mx-auto p-8 font-sans">
      <div className="flex justify-between items-center mb-10 bg-zinc-900 p-8 rounded-[2rem] text-white shadow-2xl">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Technicians</h1>
          <p className="text-zinc-400 text-sm mt-2">Manage service personnel and access levels.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            className="rounded-xl border-none bg-white/10 px-4 py-2 text-sm font-bold text-white outline-none"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
          >
            <option value="active" className="text-black">Active Only</option>
            <option value="all" className="text-black">All Statuses</option>
          </select>
          <button className="rounded-xl bg-white text-black px-5 py-2 text-xs font-black uppercase tracking-widest" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <form onSubmit={onCreate} className="bg-white p-8 rounded-[2.5rem] border border-gray-200 mb-10 shadow-sm">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-zinc-900 rounded-full"></div>
            Add Technician
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-black outline-none transition font-medium" placeholder="Full name" value={nName} onChange={(e) => setNName(e.target.value)} />
          <input className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-black outline-none transition font-medium" placeholder="Phone (optional)" value={nPhone} onChange={(e) => setNPhone(e.target.value)} />
          <input className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-black outline-none transition font-medium" placeholder="Email (optional)" value={nEmail} onChange={(e) => setNEmail(e.target.value)} />
        </div>
        <div className="mt-6">
          <button type="submit" className="w-full md:w-auto px-10 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl disabled:opacity-50 transition transform active:scale-95" disabled={creating}>
            {creating ? "Adding…" : "Add Technician"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-6 py-10 text-center font-bold text-zinc-400 uppercase tracking-widest text-xs animate-pulse" colSpan={5}>Syncing Tech Directory...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td className="px-6 py-10 text-center font-bold text-zinc-400 uppercase tracking-widest text-xs" colSpan={5}>No matching records found.</td></tr>
            ) : (
              visible.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition group">
                  <td className="px-6 py-4">
                    {editId === t.id ? (
                      <input className="w-full p-2 border rounded-lg font-bold" value={eName} onChange={(e) => setEName(e.target.value)} />
                    ) : (
                      <div className="font-black text-gray-900">{t.name || "—"}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-500">
                    {editId === t.id ? (
                      <input className="w-full p-2 border rounded-lg" value={ePhone} onChange={(e) => setEPhone(e.target.value)} />
                    ) : (t.phone || "—")}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-500">
                    {editId === t.id ? (
                      <input className="w-full p-2 border rounded-lg" value={eEmail} onChange={(e) => setEEmail(e.target.value)} />
                    ) : (t.email || "—")}
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" checked={t.active} onChange={(e) => setActive(t.id, e.target.checked)} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.active ? "Active" : "Inactive"}</span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    {editId === t.id ? (
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50" onClick={() => saveEdit(t.id)} disabled={saving}>
                          {saving ? "..." : "Save"}
                        </button>
                        <button className="px-3 py-1 border rounded-lg text-[10px] font-black uppercase tracking-widest" onClick={cancelEdit}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition" onClick={() => startEdit(t)}>Edit</button>
                        <button className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-600 transition" onClick={() => onDelete(t.id)}>Delete</button>
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