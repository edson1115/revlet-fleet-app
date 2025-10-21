// app/api/requests/route.ts (GET)
const status = (searchParams.get("status") ?? "NEW") as
  | "NEW" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

const supabase = await supabaseServer();
const { data, error } = await supabase
  .from("service_requests")
  .select(`
    id, status, scheduled_at, started_at, completed_at,
    vehicle:vehicles(id, year, make, model, unit_number),
    location:locations(id, name),
    customer:customers(id, name)
  `)
  .eq("status", status)
  .eq("company_id", companyIdFromJWT) // <- critical
  .order("created_at", { ascending: false })
  .limit(50);

if (error) return NextResponse.json({ error: error.message }, { status: 500 });
return NextResponse.json({ data });
