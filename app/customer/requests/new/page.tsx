"use client";

import { useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaPhotoUploader } from "@/components/tesla/TeslaPhotoUploader";
import { TeslaStepper } from "@/components/tesla/TeslaStepper";

import { useAIProblemDetect } from "@/app/hooks/useAIProblemDetect";
import { useAISummary } from "@/app/hooks/useAISummary";
import { useAINextService } from "@/app/hooks/useAINextService";
import { useAIParts } from "@/app/hooks/useAIParts";

export default function CustomerNewRequest() {
  const [photos, setPhotos] = useState<File[]>([]);
  const { analyzeProblem, result: problemResult } = useAIProblemDetect();
  const { summarize, summary } = useAISummary();
  const { detectNextService, nextService } = useAINextService();
  const { suggestParts, parts } = useAIParts();

  async function handleAnalyze() {
    if (photos.length === 0) return;
    const file = photos[0];

    await analyzeProblem(file);
    await summarize(file);
    await detectNextService(file);
    await suggestParts(file);
  }

  return (
    <div className="px-6 py-12 space-y-10">
      <TeslaStepper current={1} steps={["Photos", "Details", "Submit"]} />

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>

        <TeslaPhotoUploader
          onChange={(files) => setPhotos(files)}
          multiple={false}
        />

        <button
          onClick={handleAnalyze}
          className="mt-6 bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Analyze with AI
        </button>

        {problemResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">AI Detected Issue</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(problemResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
