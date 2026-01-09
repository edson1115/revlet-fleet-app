"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// --- HELPERS ---

/**
 * Enhanced Auth Helper: Standardizes token retrieval for Next.js 15.
 */
async function getSupabaseAuth() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const authCookie = allCookies.find(c => c.name.includes("-auth-token"));
    
    if (!authCookie) {
      console.error("❌ Auth Error: No session cookie found.");
      return null;
    }
    
    let val = authCookie.value;
    if (val.startsWith("base64-")) {
      val = Buffer.from(val.replace("base64-", ""), 'base64').toString('utf-8');
    }
    
    const parsed = JSON.parse(decodeURIComponent(val));
    const token = parsed.access_token;
    
    if (!token) return null;
    
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { 
        global: { 
          headers: { Authorization: `Bearer ${token}` } 
        } 
      }
    );
  } catch (err) {
    console.error("❌ Auth Helper Crash:", err);
    return null;
  }
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function logFleetEvent(entityId: string, type: string, payload: any) {
  const supabase = getServiceSupabase();
  await supabase.from("fleet_events").insert({
    entity_type: "user",
    entity_id: entityId,
    event_type: type,
    event_payload: payload,
  });
}

// ==========================================
// 1. LEAD & REPORT MANAGEMENT
// ==========================================

export async function generateShareLink(requestId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/admin/reports/${requestId}`;

  await logFleetEvent(requestId, "REPORT_SHARED_SMS", {
    url: shareUrl,
    timestamp: new Date().toISOString()
  });

  return { shareUrl };
}

export async function convertLeadToCustomer(lead: any) {
  const supabase = await getSupabaseAuth();
  if (!supabase) return { error: "Unauthorized" };

  const { data: newCustomer, error: createError } = await supabase
    .from("customers")
    .insert({
      company_name: lead.company_name,
      contact_name: lead.contact_name,
      phone: lead.phone,
      email: lead.email,
      billing_address: lead.address,
      market: lead.market || "San Antonio",
      source_lead_id: lead.id,
      status: "ACTIVE"
    })
    .select()
    .single();

  if (createError) return { error: createError.message };

  await supabase
    .from("sales_leads")
    .update({ customer_status: "CONVERTED", status: "APPROVED" })
    .eq("id", lead.id);

  revalidatePath("/admin/leads");
  revalidatePath("/admin/customers");
  
  return { success: true, customerId: newCustomer.id };
}

// ==========================================
// 2. USER MANAGEMENT
// ==========================================

export async function inviteUser(formData: FormData) {
  const supabase = getServiceSupabase();
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const fullName = formData.get("fullName") as string;
  const customerId = formData.get("customerId") as string;

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role, full_name: fullName, customer_id: customerId || null },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`
  });

  if (error) return { error: error.message };

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: email,
      role: role,
      full_name: fullName,
      customer_id: customerId || null
    });
    await logFleetEvent(data.user.id, "USER_INVITED", { role, email });
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(formData: FormData) {
  const supabase = getServiceSupabase();
  const userId = formData.get("userId") as string;

  await logFleetEvent(userId, "ACCESS_REMOVED", {
    reason: "Manual admin removal",
    timestamp: new Date().toISOString()
  });

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  await supabase.from("profiles").delete().eq("id", userId);

  revalidatePath("/admin/users");
  return { success: true };
}

// ==========================================
// 3. REPAIR & SYNC
// ==========================================

export async function repairFleetLinks() {
  const supabase = getServiceSupabase();
  const { data: customer } = await supabase.from("customers")
    .select("id")
    .ilike("company_name", "M Group")
    .single();

  if (!customer) return { error: "M Group account not found." };

  await supabase.from("profiles").update({ customer_id: customer.id }).eq("email", "customer@test.com");
  const { count: vehCount } = await supabase.from("vehicles").update({ customer_id: customer.id }).is("customer_id", null);

  const { data: techProfiles } = await supabase.from("profiles")
    .select("id, full_name, email, phone")
    .in("role", ["TECH", "TECHNICIAN"]);
  
  if (techProfiles) {
    for (const profile of techProfiles) {
      await supabase.from("technicians").upsert({
        profile_id: profile.id,
        name: profile.full_name || "New Technician",
        email: profile.email,
        phone: profile.phone,
        is_active: true
      }, { onConflict: 'email' });
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/techs");
  
  return { 
    success: true, 
    repairedVehicles: vehCount || 0,
    syncedTechs: techProfiles?.length || 0 
  };
}

// ==========================================
// 4. CUSTOMER & MARKET MANAGEMENT
// ==========================================

export async function getCustomers() {
  const supabase = await getSupabaseAuth();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("customers")
    .select(`*, service_requests(completed_at, service_title)`)
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data || []).map(cust => {
    const sortedJobs = (cust.service_requests || [])
      .filter((r: any) => r.completed_at)
      .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

    return {
      ...cust,
      last_service: sortedJobs[0]?.completed_at || null,
      last_service_title: sortedJobs[0]?.service_title || null
    };
  });
}

export async function updateCustomer(formData: FormData) {
  const supabase = await getSupabaseAuth();
  if (!supabase) return { error: "Unauthorized" };

  const customerId = formData.get("id") as string;
  const { error } = await supabase.from("customers").update({
      company_name: formData.get("company") as string,
      contact_name: formData.get("contact") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      billing_address: formData.get("billingAddress") as string,
      market: formData.get("market") as string,
    }).eq("id", customerId);

  if (error) return { error: error.message };
  revalidatePath("/admin/customers");
  return { success: true };
}

export async function getMarketPerformance() {
  const supabase = await getSupabaseAuth();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("service_requests")
    .select(`total_price, status, customers (market)`)
    .eq("status", "COMPLETED");

  if (error) return [];

  const stats: Record<string, { revenue: number; jobs: number }> = {};
  data.forEach((req: any) => {
    const market = req.customers?.market || "Unknown";
    if (!stats[market]) stats[market] = { revenue: 0, jobs: 0 };
    stats[market].revenue += req.total_price || 0;
    stats[market].jobs += 1;
  });

  return Object.entries(stats).map(([name, val]) => ({ name, ...val }));
}

export async function addManualCustomer(formData: FormData) {
  const supabase = await getSupabaseAuth();
  if (!supabase) return { error: "Unauthorized" };

  const { error } = await supabase.from("customers").insert({
      company_name: formData.get("company") as string,
      contact_name: formData.get("contact") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      market: (formData.get("market") as string) || "San Antonio",
      billing_address: formData.get("address") as string,
      status: "ACTIVE"
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/customers");
  return { success: true };
}

/**
 * Saves AI Configuration to the persistent database
 * Updated to use standard keys: openai_api_key, ai_model, ai_temperature
 */
export async function saveAISettings(config: { 
  openai_api_key: string, 
  ai_model: string, 
  ai_temperature: string 
}) {
  const supabase = await getSupabaseAuth();
  if (!supabase) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("system_settings")
    .upsert({
      key: "ai_config",
      value: config,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

  if (error) return { error: error.message };
  
  // Revalidate both the AI page and any components using this config
  revalidatePath("/admin/ai");
  return { success: true };
}