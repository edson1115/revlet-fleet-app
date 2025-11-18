// app/fm/requests/new/actions.ts

"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function createRequestAction(formData: FormData) {
  // MUST await — fixes `.from` undefined error
  const sb = await supabaseServer();

  const payload = {
    customer_id: formData.get("customer_id"),
    vehicle_id: formData.get("vehicle_id"),
    service: formData.get("service") || null,
    priority: formData.get("priority") || null,
    fmc: formData.get("fmc") || null,
    po: formData.get("po") || null,
    mileage: formData.get("mileage")
      ? Number(formData.get("mileage"))
      : null,
  };

  const { data, error } = await sb
    .from("service_requests")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error("Create request failed:", error);
    throw new Error(error.message);
  }

  return { id: data.id };
}
