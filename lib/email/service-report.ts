import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';

// Initialize Resend with your API Key (Get one at resend.com)
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendServiceReportEmail(requestId: string) {
  // 1. Setup Admin Client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Fetch Details
  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers(name, email),
      vehicle:vehicles(year, make, model, plate),
      tech:profiles!service_requests_technician_id_fkey(full_name)
    `)
    .eq("id", requestId)
    .single();

  if (error || !request || !request.customer?.email) {
    console.error("❌ Email Skip: Missing data");
    return;
  }

  // 3. Generate HTML
  const subject = `Service Completed: ${request.vehicle.year} ${request.vehicle.model}`;
  const emailHtml = `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Revlet Service Report</h1>
      <p><strong>Customer:</strong> ${request.customer.name}</p>
      <p><strong>Vehicle:</strong> ${request.vehicle.year} ${request.vehicle.model} (${request.plate})</p>
      <hr />
      <h3>Technician Notes</h3>
      <p style="white-space: pre-wrap;">${request.technician_notes || "No notes."}</p>
      <br />
      <p style="color: #888;">Completed by ${request.tech?.full_name}</p>
    </div>
  `;

  // 4. SEND IT 🚀
  try {
    const data = await resend.emails.send({
      from: 'Revlet <updates@yourdomain.com>', // Or 'onboarding@resend.dev' for testing
      to: [request.customer.email],
      subject: subject,
      html: emailHtml,
    });
    console.log("✅ Email Sent ID:", data.id);
  } catch (err) {
    console.error("❌ Resend Error:", err);
  }
}