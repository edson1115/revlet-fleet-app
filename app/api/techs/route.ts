import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function getAccessToken() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authCookie = allCookies.find(c => c.name.includes("-auth-token"));
  if (!authCookie) return null;
  try {
    let val = authCookie.value;
    if (val.startsWith("base64-")) val = Buffer.from(val.replace("base64-", ""), 'base64').toString('utf-8');
    return JSON.parse(decodeURIComponent(val)).access_token;
  } catch (e) { return null; }
}

// GET: List all San Antonio Technicians
export async function GET(request: Request) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: techs, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, active, phone")
      .in("role", ["TECHNICIAN", "TECH"])
      .eq("active_market", "San Antonio")
      .order("full_name", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ rows: (techs || []).map(t => ({
      id: t.id, 
      name: t.full_name || t.email, 
      email: t.email, 
      phone: t.phone || "—", 
      active: t.active ?? true
    }))});
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

// POST: Invite Technician
export async function POST(request: Request) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, email, phone } = await request.json(); 
    const targetEmail = email || `${name.replace(/\s+/g, '.').toLowerCase()}@revlet.com`;
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(targetEmail, {
        data: { full_name: name, role: "TECHNICIAN" },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
    });
    if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

    if (inviteData.user) {
      await supabaseAdmin.from("profiles").upsert({
        id: inviteData.user.id,
        email: targetEmail,
        full_name: name,
        role: "TECHNICIAN",
        phone: phone || null,
        active_market: "San Antonio",
        active: true
      });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

// PATCH: EDIT Technician - Read ID from searchParams
export async function PATCH(request: Request) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { name, phone, active } = await request.json();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: name, phone: phone, active: active })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

// DELETE: Remove Technician
export async function DELETE(request: Request) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await supabaseAdmin.from("profiles").delete().eq("id", id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id!);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}