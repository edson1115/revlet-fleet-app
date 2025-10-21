// snippet inside your PATCH handler
try {
  const { error: upErr } = await supabase
    .from("service_requests")
    .update({ status: "SCHEDULED", scheduled_at: new Date().toISOString() })
    .eq("id", id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }
} catch (e: any) {
  return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
}
