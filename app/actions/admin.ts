"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// --- HELPER 1: Get Client with User's Auth Token (For Standard DB Operations) ---
async function getSupabaseAuth() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.getAll().find(c => c.name.includes("-auth-token"));
  if (!authCookie) return null;
  
  let val = authCookie.value;
  if (val.startsWith("base64-")) val = Buffer.from(val.replace("base64-", ""), 'base64').toString('utf-8');
  
  const token = JSON.parse(decodeURIComponent(val)).access_token;
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// --- HELPER 2: Get Service Client (For Creating/Deleting Users) ---
// This uses the SERVICE_ROLE_KEY to bypass security for Admin tasks
function getServiceSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// ==========================================
// 1. LEAD CONVERSION (The New Feature)
// ==========================================
export async function convertLeadToCustomer(lead: any) {
  const supabase = await getSupabaseAuth();
  if (!supabase) return { error: "Unauthorized" };

  // 1. Create Customer
  const { data: newCustomer, error: createError } = await supabase
    .from("customers")
    .insert({
      company_name: lead.company_name,
      contact_name: lead.contact_name,
      phone: lead.phone,
      email: lead.email,
      billing_address: lead.address,
      source_lead_id: lead.id
    })
    .select()
    .single();

  if (createError) {
    console.error("Create Customer Error:", createError);
    return { error: createError.message };
  }

  // 2. Update Lead Status
  const { error: updateError } = await supabase
    .from("sales_leads")
    .update({ customer_status: "CONVERTED", status: "APPROVED" })
    .eq("id", lead.id);

  if (updateError) console.error("Update Lead Error:", updateError);

  revalidatePath("/admin/leads");
  return { success: true, customerId: newCustomer.id };
}

// ==========================================
// 2. USER MANAGEMENT (Restored Functions)
// ==========================================

export async function inviteUser(formData: FormData) {
    const supabase = getServiceSupabase();
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const password = "TempPassword123!"; // Default temp password

    // 1. Create Auth User
    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { role: role }
    });

    if (error) {
        console.error("Invite Error:", error);
        return { error: error.message };
    }

    // 2. Add to Profiles Table
    if (data.user) {
        await supabase.from("profiles").insert({
            id: data.user.id,
            email: email,
            role: role,
            full_name: email.split("@")[0] // Default name
        });
    }

    revalidatePath("/admin/users");
    return { success: true };
}

export async function deleteUser(formData: FormData) {
    const supabase = getServiceSupabase();
    const userId = formData.get("userId") as string;

    // 1. Delete from Auth (Profiles will auto-delete via Cascade usually, but we can be safe)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
        console.error("Delete Error:", error);
        return { error: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true };
}

// ... (keep existing imports and functions)

// --- CUSTOMER MANAGEMENT ---

export async function getCustomers() {
  const supabase = await getSupabaseAuth();
  if (!supabase) return [];

  const { data } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
    
  return data || [];
}

export async function addManualCustomer(formData: FormData) {
  const supabase = await getSupabaseAuth();
  if (!supabase) return { error: "Unauthorized" };

  const company = formData.get("company") as string;
  const contact = formData.get("contact") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const market = formData.get("market") as string;

  // Check for duplicates first!
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .ilike("company_name", company)
    .single();

  if (existing) {
      return { error: "Customer with this name already exists!" };
  }

  const { error } = await supabase.from("customers").insert({
      company_name: company,
      contact_name: contact,
      email: email,
      phone: phone,
      market: market || "San Antonio",
      status: "ACTIVE"
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/customers");
  return { success: true };
}