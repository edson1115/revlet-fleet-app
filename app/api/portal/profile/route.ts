import { createClient } from "@/lib/supabase/server-helpers";

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({}, { status: 401 });

  const { data: cust } = await supabase
    .from("customers")
    .select(
      `
      id,
      name,
      billing_contact,
      billing_email,
      billing_phone,
      secondary_contact,
      notes
    `
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  return Response.json(cust || {});
}



