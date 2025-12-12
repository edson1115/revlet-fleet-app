"use client";

import { useState } from "react";

export function useDamageAnalysis() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  async function analyze(url: string) {
    setLoading(true);
    const res = await fetch("/api/ai/damage", {
      method: "POST",
      body: JSON.stringify({ image_url: url }),
    });
    const js = await res.json();
    if (js.ok) setAnalysis(js.analysis);
    setLoading(false);
  }

  return { loading, analysis, analyze };
}
