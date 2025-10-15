// app/admin/users.tsx
"use client";
import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  role: string | null;
  company_id: string | null;
  status: "PENDING" | "ACTIVE";
};

export default function AdminUsers() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/users", { cache: "no-store" });
      const j = await r.json();
      setRows(j.rows ?? []);
      setLoading(false);
    })();
  }, []);

  async function setRole(id: string, role: string) {
    await fetch("/api/admin/set-role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    setRows((rows) => rows.map((u) => (u.id === id ? { ...u, role, status: "ACTIVE" } : u)));
  }

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="grid gap-2">
      {rows.map((u) => (
        <div key={u.id} className="flex items-center justify-between border rounded-xl p-3">
          <div>
            <div className="font-medium">{u.email}</div>
            <div className="text-sm text-neutral-500">
              {u.status} · {u.role ?? "NO ROLE"}
            </div>
          </div>
          <div className="flex gap-2">
            {["ADMIN", "OFFICE", "DISPATCH", "TECH", "CUSTOMER"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(u.id, r)}
                className="border rounded px-2 py-1 text-sm"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
