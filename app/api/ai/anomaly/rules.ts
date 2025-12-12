export function ruleEngine(health: any, faults: any[]) {
  const alerts: string[] = [];

  if (!health) return { alerts };

  // 1. Mileage Interval
  if (health.mileage > health.health_mileage_max) {
    alerts.push("Mileage interval exceeded — service recommended.");
  }

  // 2. Too many recent faults
  if (faults.length >= 3) {
    alerts.push("Multiple recent faults detected — possible recurring issue.");
  }

  // 3. Sudden health drop
  if (
    typeof health.health_score_prev === "number" &&
    health.health_score_prev - health.health_score >= 15
  ) {
    alerts.push("Sharp health score drop — immediate inspection required.");
  }

  // 4. Overheating
  if (faults.some((f) => f.code === "P0217")) {
    alerts.push("Engine overheating reported.");
  }

  // 5. Battery health
  if (health.battery_health && health.battery_health <= 40) {
    alerts.push("Low battery health.");
  }

  // 6. Tire wear
  if (health.tire_threshold && health.tire_threshold <= 15) {
    alerts.push("Tire wear at critical level.");
  }

  return { alerts };
}
