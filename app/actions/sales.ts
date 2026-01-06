"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function addLead(formData: FormData) {
  const company = formData.get("company") as string;
  const address = formData.get("address") as string;
  const contact = formData.get("contact") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const visitType = formData.get("visit_type") as string;
  const notes = formData.get("notes") as string;
  const recurrence = formData.get("recurrence") as string;
  const customerStatus = formData.get("customer_status") as string;
  
  // GPS
  const latStr = formData.get("lat") as string;
  const lngStr = formData.get("lng") as string;

  // NEW: Capture Inspection Data
  const inspectionData = formData.get("inspection_data") as string;

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authCookie = allCookies.find(c => c.name.includes("-auth-token"));
  let token = "";
  if (authCookie) {
     let val = authCookie.value;
     if (val.startsWith("base64-")) val = Buffer.from(val.replace("base64-", ""), 'base64').toString('utf-8');
     token = JSON.parse(decodeURIComponent(val)).access_token;
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  let locationPoint;
  if (latStr && lngStr) {
      locationPoint = `POINT(${lngStr} ${latStr})`;
  } else {
      const baseLat = 32.7767;
      const baseLng = -96.7970;
      const offset = () => (Math.random() - 0.5) * 0.1;
      locationPoint = `POINT(${baseLng + offset()} ${baseLat + offset()})`;
  }

  // Determine final status
  let finalStatus = "NEW";
  if (customerStatus === "ONBOARDING") finalStatus = "SENT_TO_OFFICE"; 
  // If it's an inspection and marked for office, we can treat it same as onboarding for now
  
  const { error } = await supabase.from("sales_leads").insert({
    sales_rep_id: user.id,
    company_name: company,
    address: address,
    contact_name: contact,
    phone: phone,
    email: email,
    visit_type: visitType,
    notes: notes,
    recurrence_rule: recurrence,
    customer_status: customerStatus || "COLD",
    inspection_data: inspectionData ? JSON.parse(inspectionData) : null, // Save JSON
    location: locationPoint, 
    visit_date: new Date().toISOString(),
    status: finalStatus
  });

  if (error) console.error(error);
  
  revalidatePath("/sales");
  return { success: true };
}