import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Get the Notes from the body (The Fix)
    const body = await req.json();
    const { final_notes } = body;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { } },
        },
      }
    );

    // 2. Deduct Inventory (Logic remains the same)
    const { data: jobParts } = await supabase.from('request_parts').select('*').eq('request_id', id);
    if (jobParts && jobParts.length > 0) {
        for (const part of jobParts) {
            try {
                await supabase.rpc('deduct_inventory', { p_part_number: part.part_number, p_quantity: part.quantity });
            } catch (err) { /* Ignore errors to allow closing */ }
        }
    }

    // 3. Update Status AND Notes at the same time
    const { error: statusError } = await supabase
        .from('service_requests')
        .update({ 
            status: 'COMPLETED',
            technician_notes: final_notes // ✅ SAVING NOTES HERE
        })
        .eq('id', id);

    if (statusError) throw statusError;

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error("Job Completion Error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 200 });
  }
}