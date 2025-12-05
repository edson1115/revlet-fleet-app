// app/api/requests/[id]/parts/route.ts

import { supabaseServer } from "@/lib/supabase/server";

function getRequestId(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[parts.length - 2]; 
  // .../requests/<id>/parts
}

// --------------------------------------------------------
// GET — Load all parts for a request
// --------------------------------------------------------
export async function GET(req: Request) {
  const requestId = getRequestId(req.url);
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("request_parts")
    .select("id, name, qty, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ rows: data || [] }), {
    status: 200,
  });
}

// --------------------------------------------------------
// POST — Add a new part
// Body: { name: string, qty: number }
// --------------------------------------------------------
export async function POST(req: Request) {
  const requestId = getRequestId(req.url);
  const supabase = await supabaseServer();

  const body = await req.json();
  const { name, qty } = body;

  if (!name || !qty) {
    return new Response(
      JSON.stringify({ error: "Name and qty required" }),
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("request_parts")
    .insert({
      request_id: requestId,
      name,
      qty,
    })
    .select()
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ part: data }), {
    status: 200,
  });
}

// --------------------------------------------------------
// PUT — Update part (qty or name)
// Body: { id: string, name?: string, qty?: number }
// --------------------------------------------------------
export async function PUT(req: Request) {
  const supabase = await supabaseServer();
  const body = await req.json();
  const { id, name, qty } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: "Part ID required" }), {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from("request_parts")
    .update({
      ...(name !== undefined ? { name } : {}),
      ...(qty !== undefined ? { qty } : {}),
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ part: data }), {
    status: 200,
  });
}

// --------------------------------------------------------
// DELETE — Remove a part
// Body: { id: string }
// --------------------------------------------------------
export async function DELETE(req: Request) {
  const supabase = await supabaseServer();
  const body = await req.json();
  const { id } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: "Part ID required" }), {
      status: 400,
    });
  }

  const { error } = await supabase
    .from("request_parts")
    .delete()
    .eq("id", id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
  });
}
