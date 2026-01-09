/**
 * V1 Intelligence: Fleet Brain Logic
 */

/**
 * Deterministic Risk Scoring
 * Targets Gap A: Outcome-based intelligence (What will fail next?)
 */
export function calculateVehicleRisk(mileage: number, lastServiceMiles: number, lastServiceDate: string) {
  let riskScore = 0;
  
  // Basic deltas
  const milesSinceService = mileage - lastServiceMiles;
  const lastDate = lastServiceDate ? new Date(lastServiceDate).getTime() : new Date().getTime();
  const monthsSinceService = (new Date().getTime() - lastDate) / (1000 * 60 * 60 * 24 * 30);

  // 1. Mileage Signal: Attacks the "reporting is weak" pain point
  if (milesSinceService > 5000) riskScore += 45; 
  else if (milesSinceService > 3000) riskScore += 20;

  // 2. Time-based Signal: Identifies "Likely next failure"
  if (monthsSinceService > 12) riskScore += 30;
  else if (monthsSinceService > 6) riskScore += 15;

  // 3. Complexity Flag: Hardcoded for V1 based on blueprint
  const isHighRisk = riskScore > 60;

  return {
    score: Math.min(riskScore, 100),
    level: isHighRisk ? 'HIGH' : riskScore > 30 ? 'ELEVATED' : 'STABLE',
    label: isHighRisk ? 'Likely Next Failure' : 'Healthy',
    insight: isHighRisk 
        ? "Critical: Vehicle requires immediate triage to prevent downtime." 
        : "Standard maintenance window remains open."
  };
}

/**
 * Smart Documentation: Auto-Service Summary
 * Targets Gap C: Trust & Auditability (Professional Timelines)
 */
export function generateServiceSummary(
    techNotes: string, 
    partsUsed: { name: string; quantity: number }[], 
    inspectionFlags: string[]
) {
  // Logic to build a professional "Timeline" summary
  const cleanNotes = techNotes || "No detailed technician notes provided.";
  const partsList = partsUsed.length > 0 
    ? partsUsed.map(p => `${p.quantity}x ${p.name}`).join(', ') 
    : "standard consumables";

  const summary = `Service Summary: ${cleanNotes} To ensure uptime, we installed ${partsList}. ` +
    (inspectionFlags.length > 0 
      ? `Audit flagged the following concerns: ${inspectionFlags.join(', ')}.` 
      : "No additional safety concerns were identified during this visit.");

  return {
    summary_text: summary,
    audit_status: inspectionFlags.length > 0 ? "ACTION_REQUIRED" : "COMPLIANT",
    professional_recommendation: inspectionFlags.length > 0 
      ? "Follow-up recommended within 14 days to maintain Fleet Health." 
      : "Vehicle cleared for full service duty."
  };
}