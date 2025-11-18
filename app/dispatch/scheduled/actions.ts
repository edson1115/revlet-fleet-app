"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id;
  if (!uid) return null;

  const { data: prof } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", uid)
    .maybeSingle();

  return prof?.company_id ?? null;
}

export async function markInProgressAction(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) throw new Error("Missing id");

  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) throw new Error("Missing company");

  const { error } = await supabase
    .from("service_requests")
    .update({
      status: "IN_PROGRESS",
      started_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw new Error(error.message);

  revalidatePath("/dispatch/scheduled");
}
