import { calculateVehicleRisk } from "./intelligence";

/**
 * Triggers a system alert if a vehicle crosses the high-risk threshold
 */
export async function checkAndNotifyRisk(vehicle: any) {
  const risk = calculateVehicleRisk(
    vehicle.mileage, 
    vehicle.last_service_miles, 
    vehicle.last_service_date
  );

  if (risk.level === 'HIGH') {
    console.log(`🚨 ALERT: Vehicle ${vehicle.plate} has reached HIGH RISK (${risk.score}%)`);
    
    // In a production environment, you would trigger a SendGrid email 
    // or a Twilio SMS here.
    
    return { notified: true, riskScore: risk.score };
  }

  return { notified: false };
}