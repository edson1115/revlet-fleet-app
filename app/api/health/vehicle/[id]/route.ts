import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ⭐ FIX — unwrap params Promise
  const { id } = await params;

  const supabase = await supabaseServer();

  // VEHICLE
  const { data: vehicle, error: vErr } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (vErr || !vehicle) {
    return NextResponse.json(
      { error: "Vehicle not found" },
      { status: 404 }
    );
  }

  // HEALTH SCORE
  const health = Math.max(
    20,
    100 -
      (vehicle.mileage ?? 0) / 3000 -
      (vehicle.fault_count ?? 0) * 5 -
      (vehicle.anomaly_score ?? 0) * 10
  );

  // PREDICTIONS
  const predictions = [
    {
      title: "Starter Failure Likely",
      reason: "High electrical draw pattern detected",
      eta_days: 12,
      risk_level: "HIGH",
    },
    {
      title: "Brake Service Needed",
      reason: "Heat pattern + mileage indicator",
      eta_days: 22,
      risk_level: "MEDIUM",
    },
  ];

  // RISK INDICATORS
  const risks = [
    { component: "Electrical", level: "High", message: "Voltage irregularities" },
    { component: "Brakes", level: "Medium", message: "Pad thickness trending down" },
    { component: "Cooling", level: "Low", message: "Slight temp spikes" },
  ];

  // UPCOMING MAINTENANCE
  const upcoming = [
    {
      title: "Oil Change",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    },
    {
      title: "Brake Inspection",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18),
    },
  ];

  return NextResponse.json({
    ok: true,
    vehicle,
    health,
    predictions,
    risks,
    upcoming,
  });
}
