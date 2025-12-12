export function clusterEngine(vehicle: any, groupStats: any) {
  const alerts: string[] = [];

  if (!vehicle || !groupStats) return { alerts };

  const faultRate = vehicle.fault_count;
  const avgRate = groupStats.avg_faults || 0;

  if (faultRate > avgRate * 2) {
    alerts.push("Fault frequency significantly above group norm.");
  }

  if (vehicle.mileage > groupStats.avg_mileage * 1.5) {
    alerts.push("Mileage accumulation unusually high vs peers.");
  }

  if (vehicle.health_score < groupStats.avg_health_score - 20) {
    alerts.push("Health score far below group average.");
  }

  return { alerts };
}
