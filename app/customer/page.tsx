"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/permissions";

type Me = {
  role: string;
};

type RequestRow = {
  id: string;
  status: string;
  service?: string | null;
  notes?: string | null;
  customer?: { name?: string | null } | null;
  location?: { name?: string | null } | null;
  vehicle?: {
    unit_number?: string | null;
    make?: string | null;
    model?: string | null;
  } | null;
  created_at?: string | null;
  scheduled_at?: string | null;
  completed_at?: string | null;
};

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  return (await res.json()) as T;
}

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const js = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(js?.error || res.statusText);
  }
  return js as T;
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerPortalPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [svc, setSvc] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const meResp = await getJSON<any>("/api/me");
        const role = normalizeRole(meResp.role || meResp.me?.role);

        const customerRoles = new Set([
          "CUSTOMER",
          "CUSTOMER_USER",
          "CUSTOMER_ADMIN",
          "CLIENT",
        ]);
        const internalRoles = new Set([
          "SUPERADMIN",
          "ADMIN",
          "OFFICE",
          "DISPATCH",
        ]);

        if (!customerRoles.has(role) && !internalRoles.has(role)) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);

        const qs = new URLSearchParams();
        qs.set(
          "status",
          [
            "WAITING_TO_BE_SCHEDULED",
            "SCHEDULED",
            "IN_PROGRESS",
            "COMPLETED",
          ].join(",")
        );

        const out = await getJSON<{ rows?: RequestRow[] }>(
          `/api/requests?${qs.toString()}`
        );
        const all = out.rows || [];

        const now = new Date();
        const cutoff = new Date(
          now.getTime() - 60 * 24 * 60 * 60 * 1000
        );

        const filtered = all.filter((r) => {
          const ns = (r.status || "").toUpperCase();
          if (ns !== "COMPLETED") return true;
          if (!r.completed_at) return true;
          const done = new Date(r.completed_at);
          return done >= cutoff;
        });

        filtered.sort((a, b) => {
          const sa = (a.status || "").toUpperCase();
          const sb = (b.status || "").toUpperCase();
          const activeA = sa !== "COMPLETED";
          const activeB = sb !== "COMPLETED";
          if (activeA && !activeB) return -1;
          if (!activeA && activeB) return 1;

          const ta =
            new Date(a.created_at || a.scheduled_at || 0).getTime() || 0;
          const tb =
            new Date(b.created_at || b.scheduled_at || 0).getTime() || 0;
          return tb - ta;
        });

        setRows(filtered);
      } catch (e: any) {
        setErr(
          e?.message ||
            "Unable to load your service requests. Please contact your service office."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitMsg(null);
    if (!svc.trim()) {
      setSubmitMsg("Please describe the service needed.");
      return;
    }
    try {
      setSubmitting(true);
      await postJSON("/api/requests", {
        service: svc.trim(),
        notes: note.trim() || null,
        source: "CUSTOMER_PORTAL",
      });
      setSvc("");
      setNote("");
      setSubmitMsg(
        "Request submitted. Your dispatch team will update the status here."
      );

      // reload (best-effort)
      const qs = new URLSearchParams();
      qs.set(
        "status",
        [
          "WAITING_TO_BE_SCHEDULED",
          "SCHEDULED",
          "IN_PROGRESS",
          "COMPLETED",
        ].join(",")
      );
      try {
        const out = await getJSON<{ rows?: RequestRow[] }>(
          `/api/requests?${qs.toString()}`
        );
        const all = out.rows || [];
        const now = new Date();
        const cutoff = new Date(
          now.getTime() - 60 * 24 * 60 * 60 * 1000
        );
        const filtered = all.filter((r) => {
          const ns = (r.status || "").toUpperCase();
          if (ns !== "COMPLETED") return true;
          if (!r.completed_at) return true;
          const done = new Date(r.completed_at);
          return done >= cutoff;
        });
        filtered.sort((a, b) => {
          const ta =
            new Date(a.created_at || a.scheduled_at || 0).getTime() || 0;
          const tb =
            new Date(b.created_at || b.scheduled_at || 0).getTime() || 0;
          return tb - ta;
        });
        setRows(filtered);
      } catch {
        // ignore
      }
    } catch (e: any) {
      setSubmitMsg(
        e?.message ||
          "Could not submit request. Please contact your service office."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authorized === false) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-gray-600">
          This portal is for invited customer accounts. If you believe this is an error, please contact your service provider.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-3 text-xs text-gray-500 underline"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customer Portal</h1>
        <p className="text-sm text-gray-600">
          Submit new service requests and track status. Completed jobs older than 60 days are removed per retention policy.
        </p>
      </div>

      <section className="rounded-2xl border bg-white shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold">
          Create a new service request
        </h2>
        <form onSubmit={submitRequest} className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              What do you need help with? (required)
            </label>
            <input
              value={svc}
              onChange={(e) => setSvc(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Example: PM service for unit 123, low coolant, ABS light on..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Extra details (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="Parking location, access instructions, preferred time, etc."
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit request"}
            </button>
            {submitMsg && (
              <div className="text-[11px] text-gray-700 max-w-xs">
                {submitMsg}
              </div>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">
          Your recent service requests
        </h2>

        {loading && (
          <div className="text-sm text-gray-500">Loading…</div>
        )}

        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        {!loading && !err && rows.length === 0 && (
          <div className="text-sm text-gray-500">
            No recent service requests found under your account.
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border px-3 py-3 text-sm bg-white shadow-sm"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {r.service || "Service request"}
                    </div>
                    {r.location?.name && (
                      <div className="text-xs text-gray-600">
                        {r.location.name}
                      </div>
                    )}
                    {r.vehicle && (
                      <div className="text-xs text-gray-600">
                        {[r.vehicle.unit_number, r.vehicle.make, r.vehicle.model]
                          .filter(Boolean)
                          .join(" ")}
                      </div>
                    )}
                    {r.notes && (
                      <div className="mt-1 text-[11px] text-gray-600 line-clamp-2">
                        {r.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <div className="inline-block rounded-full border px-2 py-0.5">
                      {r.status}
                    </div>
                    <div className="mt-1 text-gray-500">
                      Created: {fmt(r.created_at)}
                    </div>
                    {r.scheduled_at && (
                      <div className="text-gray-500">
                        ETA: {fmt(r.scheduled_at)}
                      </div>
                    )}
                    {r.completed_at && (
                      <div className="text-gray-500">
                        Completed: {fmt(r.completed_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="pt-2">
        <button
          onClick={() => router.push("/")}
          className="text-xs text-gray-500 underline"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
