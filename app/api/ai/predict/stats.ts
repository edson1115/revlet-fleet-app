export function statisticalFailurePrediction(vehicle: any, faults: any[]) {
  const preds: any[] = [];

  if (!vehicle) return { predictions: preds };

  const now = Date.now();

  const recentFaults = faults.slice(0, 5);

  // Simple probability model: 0.1 per repeated identical fault
  const freqMap: Record<string, number> = {};

  recentFaults.forEach((f) => {
    freqMap[f.code] = (freqMap[f.code] || 0) + 1;
  });

  Object.entries(freqMap).forEach(([code, freq]) => {
    if (freq >= 2) {
      preds.push({
        component: code,
        probability: Math.min(0.1 * freq, 0.85),
        eta_days: 14 + freq * 3,
        reason: "Repeated fault pattern indicates likely failure soon.",
      });
    }
  });

  return { predictions: preds };
}
