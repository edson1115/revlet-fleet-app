// app/tech/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RequestRow = {
  id: string;
  status: string;
  service: string | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  vehicle: {
    id: string;
    make: string | null;
    model: string | null;
    year: number | null;
    unit_number: string | null;
  } | null;
  customer: {
    id: string;
    name: string | null;
  } | null;
  location: {
    id: string;
    name: string | null;
  } | null;
};

export default function TechPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);

    const res = await fetch("/api/tech/requests", {
      method: "GET",
      credentials: "include",
    });

    const json = await res.json();
    if (json.ok) setRequests(json.requests);

    setLoading(false);
  }

  async function startJob(id: string) {
    setActionLoading(id);

    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      body: JSON.stringify({ action: "start_job" }),
    });

    setActionLoading(null);
    if (!res.ok) return alert("Error starting job");

    await loadRequests();
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-10 space-y-10">
      <h1 className="text-4xl font-semibold tracking-tight">
        Technician Dashboard
      </h1>

      <p className="text-gray-600 text-lg">
        View your assigned jobs and begin work.
      </p>

      {loading && (
        <div className="border rounded-2xl bg-white p-10 shadow-sm">
          Loading jobs...
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="border rounded-2xl bg-white p-10 shadow-sm text-gray-500">
          No jobs assigned.
        </div>
      )}

      <div className="space-y-6">
        {requests.map((r) => (
          <div
            key={r.id}
            onClick={() => router.push(`/tech/requests/${r.id}`)}
            className="border rounded-2xl bg-white p-6 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col md:flex-row justify-between"
          >
            <div>
              <div className="text-xl font-semibold">
                {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}
              </div>
              <div className="text-gray-500">
                Unit #{r.vehicle?.unit_number || "—"}
              </div>
              <div className="mt-2 text-gray-700">
                Service: <b>{r.service || "General Service"}</b>
              </div>
              <div className="text-gray-600">
                Customer: {r.customer?.name || "—"}
              </div>
              <div className="text-gray-600">
                Location: {r.location?.name || "—"}
              </div>
              <div className="mt-2">
                Status:{" "}
                <span className="font-semibold text-blue-600">
                  {r.status}
                </span>
              </div>
            </div>

            {r.status === "SCHEDULED" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startJob(r.id);
                }}
                disabled={actionLoading === r.id}
                className="mt-4 md:mt-0 self-start md:self-center px-6 py-3 rounded-xl bg-black text-white text-lg font-medium shadow hover:bg-gray-900 disabled:opacity-40"
              >
                {actionLoading === r.id ? "Starting..." : "Start Job"}
              </button>
            )}

            {r.status !== "SCHEDULED" && (
              <p className="text-gray-400 self-start md:self-center mt-4 md:mt-0">
                {r.status === "IN_PROGRESS"
                  ? "In Progress"
                  : r.status === "COMPLETED"
                  ? "Completed"
                  : "Waiting"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



