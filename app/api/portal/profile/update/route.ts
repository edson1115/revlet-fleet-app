import { createClient } from "@/lib/supabase/server-helpers";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();

  const { data: updated, error } = await supabase
    .from("customers")
    .update({
      name: body.name,
      billing_contact: body.billing_contact,
      billing_email: body.billing_email,
      billing_phone: body.billing_phone,
      secondary_contact: body.secondary_contact,
      notes: body.notes,
    })
    .eq("profile_id", user.id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(updated);
}



