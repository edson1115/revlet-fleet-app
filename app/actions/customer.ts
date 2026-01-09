"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Fetches the specific profile and billing info for the logged-in customer.
 */
export async function getCustomerProfile() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.getAll().find(c => c.name.includes("-auth-token"));
  if (!authCookie) return null;

  let val = authCookie.value;
  if (val.startsWith("base64-")) val = Buffer.from(val.replace("base64-", ""), 'base64').toString('utf-8');
  const token = JSON.parse(decodeURIComponent(val)).access_token;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.user_metadata.customer_id) return null;

  const { data } = await supabase
    .from("customers")
    .select("company_name, contact_name, phone, email, billing_address, market")
    .eq("id", user.user_metadata.customer_id)
    .single();

  return data;
}