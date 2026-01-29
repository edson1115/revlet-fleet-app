"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function useProductTour(tourKey: string, steps: any[]) {
  
  const startTour = () => {
    const tourDriver = driver({
      showProgress: true,
      animate: true,
      steps: steps,
      onDestroyStarted: () => {
        // Mark as seen when they finish or close it
        localStorage.setItem(`tour_seen_${tourKey}`, "true");
        tourDriver.destroy();
      },
    });

    tourDriver.drive();
  };

  // Auto-start on first visit
  useEffect(() => {
    const hasSeen = localStorage.getItem(`tour_seen_${tourKey}`);
    if (!hasSeen) {
      // Small delay to ensure UI is loaded
      setTimeout(() => startTour(), 1000);
    }
  }, [tourKey]);

  return { startTour };
}