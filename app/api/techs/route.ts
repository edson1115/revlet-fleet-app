import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Helper to reliably extract the token using Next.js cookies()
async function getAccessToken() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authCookie = allCookies.find(c => c.name.includes("-auth-token"));

  if (!authCookie) return null;

  try {
    let rawValue = authCookie.value;
    
    // Handle the "base64-" prefix we added in the Session Bridge
    if (rawValue.startsWith("base64-")) {
      rawValue = rawValue.replace("base64-", "");
      rawValue = Buffer.from(rawValue, 'base64').toString('utf-8');
    }
    
    // standard decode
    rawValue = decodeURIComponent(rawValue);
    
    // Parse the JSON object
    const sessionData = JSON.parse(rawValue);
    return sessionData.access_token;
  } catch (e) {
    console.error("API Token Parse Error:", e);
    return null;
  }
}

// GET: List all Technicians
export async function GET(request: Request) {
  try {
    // 1. Verify Authentication
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Use Service Role to fetch profiles
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Fetch profiles where role is TECHNICIAN
    const { data: techs, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, active")
      .eq("role", "TECHNICIAN")
      .order("full_name", { ascending: true });

    if (error) throw error;

    const rows = techs.map(t => ({
      id: t.id,
      name: t.full_name || t.email, 
      active: t.active
    }));

    return NextResponse.json({ rows });

  } catch (error: any) {
    console.error("Tech API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new Technician (Invite)
export async function POST(request: Request) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name } = body;
    // We generate a fake email if one isn't provided, or use the name to make one
    // But usually you'd want an email input. For now, assuming the UI sends 'name'
    // Let's assume the user enters a name and we generate a dummy email or the UI sends an email.
    // Looking at your UI code, it only sends { name, active }.
    // We'll generate a placeholder email for now so the invite works.
    
    const email = `${name.replace(/\s+/g, '.').toLowerCase()}@revlet.com`;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Invite User
    const { data: user, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name, role: "TECHNICIAN" }
    });

    if (inviteError) throw inviteError;

    // 2. Ensure Profile Role is Set
    // (The trigger should handle this, but we force update to be safe)
    if (user.user) {
        await supabaseAdmin
            .from("profiles")
            .update({ role: "TECHNICIAN", full_name: name })
            .eq("id", user.user.id);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a Technician
export async function DELETE(request: Request) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}