// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

/** Create an authenticated server client (Next.js 15 requires awaiting cookies()). */
async function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const jar = await cookies(); // ← important: await

  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => jar.get(name)?.value,
      set: (name: string, value: string, opts: any) => {
        // Next 15: use cookie jar to set/remove
        jar.set({ name, value, ...opts });
      },
      remove: (name: string, opts: any) => {
        jar.set({ name, value: "", ...opts });
      },
    },
  });
}

function toUiRow(r: any) {
  const t = r.technician || null;
  const v = r.vehicle || null;
  return {
    id: r.id,
    status: r.status,
    created_at: r.created_at ?? null,
    scheduled_at: r.scheduled_at ?? null,
    started_at: r.started_at ?? null,
    completed_at: r.completed_at ?? null,
    service: r.service ?? null,
    dispatch_notes: r.dispatch_notes ?? null,
    notes: r.notes ?? null,
    customer: r.customer ? { id: r.customer.id, name: r.customer.name ?? null } : null,
    location: r.location ? { id: r.location.id, name: r.location.name ?? null } : null,
    vehicle: v
      ? {
          id: v.id,
          unit_number: v.unit_number ?? null,
          year: v.year ?? null,
          make: v.make ?? null,
          model: v.model ?? null,
          plate: v.plate ?? null,
        }
      : null,
    technician: t
      ? { id: t.id, name: t.full_name ?? null, full_name: t.full_name ?? null }
      : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const sb = await supa();

    const { searchParams } = new URL(req.url);
    const statuses = (searchParams.get("status") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const technicianId = searchParams.get("technician_id") || searchParams.get("tech_id") || null;
    const includeUnassigned = (searchParams.get("includeUnassigned") || "") === "1";

    const sortBy = (searchParams.get("sortBy") || "scheduled_at").trim();
    const sortDir = (searchParams.get("sortDir") || "asc").toLowerCase() === "desc" ? "desc" : "asc";

    // IMPORTANT: relationship keys must match your schema table names
    const select = `
      id, status, created_at, scheduled_at, started_at, completed_at, service, dispatch_notes, notes,
      customer:customer_id ( id, name ),
      location:location_id ( id, name ),
      vehicle:vehicle_id ( id, unit_number, year, make, model, plate ),
      technician:technician_id ( id, full_name )
    `;

    let q = sb.from("service_requests").select(select);

    if (statuses.length) q = q.in("status", statuses);

    if (technicianId) {
      // For debugging, allow pulling unassigned rows too
      if (includeUnassigned) {
        q = q.or(`technician_id.eq.${technicianId},technician_id.is.null`);
      } else {
        q = q.eq("technician_id", technicianId);
      }
    }

    q = q.order(sortBy as any, { ascending: sortDir === "asc", nullsFirst: false });

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ rows: (data || []).map(toUiRow) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch requests" }, { status: 400 });
  }
}
