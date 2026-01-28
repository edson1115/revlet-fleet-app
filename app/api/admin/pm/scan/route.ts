import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  // Service Role to access all data
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch all PM Schedules + Vehicle Data
  const { data: schedules } = await supabase
    .from("pm_schedules")
    .select(`
        *,
        vehicle:vehicles(id, current_odometer, customer_id)
    `);

  if (!schedules) return NextResponse.json({ created: 0 });

  let ticketsCreated = 0;

  for (const schedule of schedules) {
      const milesDue = (schedule.last_service_odometer || 0) + (schedule.interval_miles || 999999);
      const isMilesDue = (schedule.vehicle.current_odometer || 0) >= milesDue;
      
      const isDateDue = new Date() >= new Date(schedule.next_due_date);

      if (isMilesDue || isDateDue) {
          // CHECK: Don't duplicate if an open ticket already exists for this vehicle
          const { data: existing } = await supabase
            .from("service_requests")
            .select("id")
            .eq("vehicle_id", schedule.vehicle.id)
            .eq("status", "DRAFT") // Only check drafts/pending
            .ilike("service_title", `%${schedule.service_name}%`)
            .single();

          if (!existing) {
              // CREATE TICKET
              await supabase.from("service_requests").insert({
                  customer_id: schedule.vehicle.customer_id,
                  vehicle_id: schedule.vehicle.id,
                  status: "DRAFT", // Draft so you can review before sending
                  service_title: `PM DUE: ${schedule.service_name}`,
                  description: `System generated PM. \nDue Reason: ${isMilesDue ? 'Mileage' : 'Date'} \nLast Service: ${new Date(schedule.last_service_date).toLocaleDateString()}`
              });
              ticketsCreated++;
          }
      }
  }

  return NextResponse.json({ 
      success: true, 
      scanned: schedules.length, 
      tickets_created: ticketsCreated 
  });
}