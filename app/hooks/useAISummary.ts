"use client";
import { useState } from "react";

export function useAISummary() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function run(imageId: string) {
    setLoading(true);
    try {
      const r = await fetch("/api/ai/summary", {
        method: "POST",
        body: JSON.stringify({ imageId }),
      });
      const js = await r.json();
      setResult(js.summary || "");
    } finally {
      setLoading(false);
    }
  }

  return { loading, result, run };
}
