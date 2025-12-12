export function computeWearPredictions(health: any, usage: any) {
  const predictions: any[] = [];

  if (!health || !usage) return { predictions };

  const dailyMiles = usage.daily_miles || 0;
  const currentMiles = health.mileage || 0;

  // 1. Oil Change
  if (health.next_oil_miles) {
    const milesLeft = health.next_oil_miles - currentMiles;
    const days = dailyMiles > 0 ? Math.ceil(milesLeft / dailyMiles) : null;

    predictions.push({
      type: "Oil Change",
      miles_left: milesLeft,
      eta_days: days,
    });
  }

  // 2. Tires
  if (health.tire_life_left) {
    const tireDays =
      dailyMiles > 0 ? Math.ceil((health.tire_life_left / 0.3) / dailyMiles) : null;

    predictions.push({
      type: "Tires",
      tread_remaining: health.tire_life_left,
      eta_days: tireDays,
    });
  }

  // 3. Brakes
  if (health.brake_life_left) {
    const brakeDays =
      dailyMiles > 0
        ? Math.ceil((health.brake_life_left / 0.2) / dailyMiles)
        : null;

    predictions.push({
      type: "Brakes",
      pad_depth: health.brake_life_left,
      eta_days: brakeDays,
    });
  }

  return { predictions };
}
