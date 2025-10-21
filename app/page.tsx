// app/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Row = {
  id: string;
  status:
    | "NEW"
    | "WAITING_APPROVAL"
    | "WAITING_PARTS"
    | "DECLINED"
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED";
  created_at: string;
  scheduled_at: string | null;
  service: string | null;
  po: string | null;
  notes: string | null;
  customer?: { name?: string | null } | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
};

async function resolveCompanyId() {
  const supabase = await supabaseServer();

  // Prefer the logged-in profile's company_id
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id || null;
  if (uid) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", uid)
      .maybeSingle();
    if (prof?.company_id) return { supabase, company_id: prof.company_id as string };
  }

  // Fallback: any recent vehicle that has company_id
  const { data: v } = await supabase
    .from("vehicles")
    .select("company_id")
    .not("company_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { supabase, company_id: (v?.company_id as string) ?? null };
}

function vehLabel(r: Row) {
  const v = r.vehicle || {};
  return [v.year, v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ");
}

async function fetchByStatus(supabase: any, company_id: string, status: Row["status"]) {
  const { data } = await supabase
    .from("service_requests")
    .select(
      `
      id, status, created_at, scheduled_at, service, po, notes,
      customer:customer_id ( name ),
      vehicle:vehicle_id ( year, make, model, plate, unit_number )
    `
    )
    .eq("company_id", company_id)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(8); // show last 8 on dashboard
  return (data as Row[]) ?? [];
}

export default async function Home() {
  const { supabase, company_id } = await resolveCompanyId();

  const sections: { key: Row["status"]; title: string; hint?: string; link?: string }[] = [
    { key: "NEW", title: "New" },
    { key: "WAITING_APPROVAL", title: "Waiting Approval" },
    { key: "WAITING_PARTS", title: "Waiting Parts" },
    { key: "DECLINED", title: "Declined" },
    { key: "SCHEDULED", title: "Scheduled", hint: "Ready to dispatch" },
    { key: "IN_PROGRESS", title: "In Progress" },
    { key: "COMPLETED", title: "Completed", link: "/reports/completed" },
  ];

  const dataByStatus: Record<string, Row[]> = {};
  if (company_id) {
    for (const s of sections) {
      dataByStatus[s.key] = await fetchByStatus(supabase, company_id, s.key);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Revlet Fleet</h1>
      <p className="text-sm text-gray-600">
        You are signed in. This dashboard shows latest activity by status. Use the tiles below to jump into a
        workflow.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link className="rounded-lg border px-3 py-1 hover:bg-gray-50" href="/fm/requests/new">
          Create Request
        </Link>
        <Link className="rounded-lg border px-3 py-1 hover:bg-gray-50" href="/office/queue">
          Office Queue
        </Link>
        <Link className="rounded-lg border px-3 py-1 hover:bg-gray-50" href="/dispatch/scheduled">
          Dispatch
        </Link>
        <Link className="rounded-lg border px-3 py-1 hover:bg-gray-50" href="/tech/queue">
          Tech
        </Link>
        <Link className="rounded-lg border px-3 py-1 hover:bg-gray-50" href="/reports">
          Reports
        </Link>
        <Link className="rounded-lg border px-3 py-1 hover:bg-gray-50" href="/admin/markets">
          Admin
        </Link>
      </div>

      {!company_id ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          No company detected. Create a vehicle or ensure your profile has a company_id.
        </div>
      ) : null}

      {/* Status sections */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((s) => {
          const rows = dataByStatus[s.key] || [];
          const count = rows.length;
          return (
            <div key={s.key} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {s.title} <span className="text-gray-500 font-normal">({count})</span>
                </h2>
                {s.key === "COMPLETED" ? (
                  <Link className="text-blue-600 underline text-sm" href={s.link || "/reports/completed"}>
                    View all
                  </Link>
                ) : (
                  <Link
                    className="text-blue-600 underline text-sm"
                    href={`/office/queue?status=${encodeURIComponent(s.key)}`}
                  >
                    Open in Office
                  </Link>
                )}
              </div>
              {s.hint && <div className="text-xs text-gray-500 mt-1">{s.hint}</div>}
              <div className="mt-3 space-y-2">
                {rows.length === 0 ? (
                  <div className="text-sm text-gray-500">No items.</div>
                ) : (
                  rows.map((r) => (
                    <div key={r.id} className="rounded-lg border px-3 py-2">
                      <div className="text-sm font-medium">{r.customer?.name || "—"}</div>
                      <div className="text-xs text-gray-600">
                        {vehLabel(r) || "—"} · {r.service || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Created {new Date(r.created_at).toLocaleString()}
                        {r.scheduled_at ? ` · Scheduled ${new Date(r.scheduled_at).toLocaleString()}` : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
