// app/admin/markets/ui/MarketsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Id = string;
type Market = { id: Id; name: string };
type Customer = { id: Id; name: string };

export default function MarketsClient() {
  // data
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selected, setSelected] = useState<Market | null>(null);
  const [left, setLeft] = useState<Customer[]>([]);   // unassigned
  const [right, setRight] = useState<Customer[]>([]); // assigned

  // ui state
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);
  const [leftSel, setLeftSel] = useState<Set<Id>>(new Set());
  const [rightSel, setRightSel] = useState<Set<Id>>(new Set());
  const [repairing, setRepairing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  // -------- helpers

  async function loadMarkets() {
    setErr("");
    try {
      const res = await fetch("/api/admin/markets", { cache: "no-store" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `GET /api/admin/markets ${res.status}`);
      }
      const rows = (await res.json()) as Market[];
      // Debug visibility
      console.log("[MarketsClient] markets fetched:", rows);
      setMarkets(rows);
      // keep selection if still present, otherwise pick first
      if (rows.length) {
        setSelected((prev) => (prev && rows.find((m) => m.id === prev.id)) || rows[0]);
      } else {
        setSelected(null);
      }
    } catch (e: any) {
      console.error("[MarketsClient] loadMarkets error:", e);
      setErr(e?.message ?? "Failed to load markets");
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignment(marketId: Id) {
    setErr("");
    try {
      const res = await fetch(`/api/admin/markets/${marketId}/customers`, { cache: "no-store" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `GET /api/admin/markets/${marketId}/customers ${res.status}`);
      }
      const j = (await res.json()) as { assigned: Customer[]; unassigned: Customer[] };
      console.log("[MarketsClient] assignment fetched:", j);
      setLeft(j.unassigned ?? []);
      setRight(j.assigned ?? []);
      setLeftSel(new Set());
      setRightSel(new Set());
    } catch (e: any) {
      console.error("[MarketsClient] loadAssignment error:", e);
      setErr(e?.message ?? "Failed to load assignments");
      setLeft([]);
      setRight([]);
    }
  }

  useEffect(() => {
    loadMarkets();
  }, []);

  useEffect(() => {
    if (selected?.id) loadAssignment(selected.id);
  }, [selected?.id]);

  const filtered = useMemo(
    () =>
      query.trim()
        ? markets.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
        : markets,
    [markets, query]
  );

  async function createMarket() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `POST /api/admin/markets ${res.status}`);
      }
      setNewName("");
      await loadMarkets();
    } catch (e: any) {
      console.error("[MarketsClient] createMarket error:", e);
      setErr(e?.message ?? "Failed to create market");
    } finally {
      setCreating(false);
    }
  }

  async function renameMarket(m: Market, name: string) {
    const next = name.trim();
    if (!next || next === m.name) return;
    setErr("");
    try {
      const res = await fetch(`/api/admin/markets/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `PATCH /api/admin/markets/${m.id} ${res.status}`);
      }
      await loadMarkets();
    } catch (e: any) {
      console.error("[MarketsClient] renameMarket error:", e);
      setErr(e?.message ?? "Failed to rename market");
    }
  }

  async function deleteMarket(m: Market) {
    if (!confirm(`Delete market "${m.name}"? This cannot be undone.`)) return;
    const pwd = prompt("Enter the ADMIN delete password (15 characters):") ?? "";
    if (pwd.length !== 15) {
      alert("Password must be exactly 15 characters.");
      return;
    }
    setErr("");
    try {
      const res = await fetch(`/api/admin/markets/${m.id}`, {
        method: "DELETE",
        headers: { "x-admin-password": pwd },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `DELETE /api/admin/markets/${m.id} ${res.status}`);
      }
      await loadMarkets();
    } catch (e: any) {
      console.error("[MarketsClient] deleteMarket error:", e);
      setErr(e?.message ?? "Failed to delete market");
    }
  }

  function assign() {
    const move = left.filter((c) => leftSel.has(c.id));
    setRight((r) => [...r, ...move].sort((a, b) => a.name.localeCompare(b.name)));
    setLeft((l) => l.filter((c) => !leftSel.has(c.id)));
    setLeftSel(new Set());
  }

  function unassign() {
    const move = right.filter((c) => rightSel.has(c.id));
    setLeft((l) => [...l, ...move].sort((a, b) => a.name.localeCompare(b.name)));
    setRight((r) => r.filter((c) => !rightSel.has(c.id)));
    setRightSel(new Set());
  }

  async function saveAssignments() {
    if (!selected) return;
    setSavingAssign(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/markets/${selected.id}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the FULL list of assigned ids (server replaces assignment)
        body: JSON.stringify({ customer_ids: right.map((c) => c.id) }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `POST /api/admin/markets/${selected.id}/customers ${res.status}`);
      }
      alert("Assignments saved");
    } catch (e: any) {
      console.error("[MarketsClient] saveAssignments error:", e);
      setErr(e?.message ?? "Failed to save assignments");
    } finally {
      setSavingAssign(false);
    }
  }

  async function repairData() {
    setRepairing(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/markets/repair", { method: "POST" });
      const t = await res.text();
      let j: any = {};
      try {
        j = JSON.parse(t);
      } catch {
        /* noop */
      }
      if (!res.ok) throw new Error(j?.error || t || "Repair failed");
      alert(
        `Repair done. Markets created: ${j?.created ?? 0}, Orphaned customer links cleared: ${j?.cleared ?? 0}`
      );
      await loadMarkets();
      if (selected?.id) await loadAssignment(selected.id);
    } catch (e: any) {
      console.error("[MarketsClient] repairData error:", e);
      setErr(e?.message ?? "Repair failed");
    } finally {
      setRepairing(false);
    }
  }

  // -------- render

  const showing = filtered;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1: Markets list + actions */}
      <div className="col-span-1 space-y-3">
        {err && (
          <div className="text-sm rounded-lg border border-red-200 bg-red-50 p-2 text-red-700">
            {err}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Search markets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={repairData}
            className="px-3 py-2 rounded-xl bg-purple-600 text-white disabled:opacity-50"
            disabled={repairing}
            title="Repair core markets and clear orphaned links"
          >
            {repairing ? "…" : "Repair"}
          </button>
        </div>

        {/* Debug line so we *see* counts */}
        <div className="text-xs text-gray-500">
          {loading ? "Loading markets…" : `Markets loaded: ${markets.length}`}
        </div>

        <div className="space-y-2 max-h-[24rem] overflow-auto border rounded-xl p-2">
          {showing.length === 0 ? (
            <div className="text-sm text-gray-500 p-2">
              {loading ? "Loading…" : "No markets for your company."}
            </div>
          ) : (
            showing.map((m) => (
              <div
                key={m.id}
                className={`flex items-center justify-between gap-2 px-2 py-2 rounded-lg cursor-pointer ${
                  selected?.id === m.id ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelected(m)}
              >
                <input
                  defaultValue={m.name}
                  className="bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-gray-200 focus:border-gray-300 focus:bg-white"
                  onBlur={(e) => {
                    const v = e.currentTarget.value.trim();
                    if (v && v !== m.name) renameMarket(m, v);
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMarket(m);
                  }}
                  className="text-xs px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700"
                  title="Delete market (ADMIN password required)"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            className="w-full border rounded-xl px-3 py-2"
            placeholder="New market name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createMarket()}
          />
          <button
            onClick={createMarket}
            disabled={creating || !newName.trim()}
            className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50"
          >
            {creating ? "…" : "Add"}
          </button>
        </div>
      </div>

      {/* Column 2 & 3: Assignment */}
      <div className="col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Assign Customers {selected ? `→ ${selected.name}` : ""}
          </h3>
          <button
            onClick={saveAssignments}
            disabled={!selected || savingAssign}
            className="px-3 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
          >
            {savingAssign ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left: Unassigned */}
          <div className="border rounded-xl p-3">
            <div className="font-medium mb-2">Unassigned</div>
            <div className="max-h-[20rem] overflow-auto space-y-1">
              {left.map((c) => {
                const checked = leftSel.has(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer ${
                      checked ? "bg-gray-100" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(leftSel);
                        e.target.checked ? next.add(c.id) : next.delete(c.id);
                        setLeftSel(next);
                      }}
                    />
                    <span>{c.name}</span>
                  </label>
                );
              })}
              {left.length === 0 && (
                <div className="text-sm text-gray-500">No unassigned customers</div>
              )}
            </div>
          </div>

          {/* Middle: Buttons */}
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              onClick={assign}
              disabled={!leftSel.size || !selected}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              Assign →
            </button>
            <button
              onClick={unassign}
              disabled={!rightSel.size || !selected}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              ← Unassign
            </button>
          </div>

          {/* Right: Assigned */}
          <div className="border rounded-xl p-3">
            <div className="font-medium mb-2">Assigned</div>
            <div className="max-h-[20rem] overflow-auto space-y-1">
              {right.map((c) => {
                const checked = rightSel.has(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer ${
                      checked ? "bg-gray-100" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(rightSel);
                        e.target.checked ? next.add(c.id) : next.delete(c.id);
                        setRightSel(next);
                      }}
                    />
                    <span>{c.name}</span>
                  </label>
                );
              })}
              {right.length === 0 && (
                <div className="text-sm text-gray-500">No customers assigned</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



