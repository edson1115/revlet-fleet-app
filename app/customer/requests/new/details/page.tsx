"use client";

import { useEffect, useState } from "react";
import { TeslaStepper } from "@/components/tesla/TeslaStepper";

import { useAIProblemDetect } from "@/hooks/useAIProblemDetect";
import { useAISummary } from "@/hooks/useAISummary";
import { useAINextService } from "@/hooks/useAINextService";
import { useAIParts } from "@/hooks/useAIParts";

export default function NewRequestDetailsPage() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { run: detectProblem } = useAIProblemDetect();
  const { run: runSummary, result: summary } = useAISummary();
  const { run: detectNextService } = useAINextService();
  const { run: detectParts } = useAIParts();

  useEffect(() => {
    const url = sessionStorage.getItem("revlet-new-request-photo");
    if (!url) return;
    setPhotoUrl(url);

    async function runAI() {
      const [problem, nextService, parts] = await Promise.all([
        detectProblem(url),
        detectNextService(url),
        detectParts(url),
      ]);

      await runSummary("mock-id");

      setAnalysis({
        problem,
        nextService,
        parts,
      });

      setLoading(false);
    }

    runAI();
  }, []);

  function handleNext() {
    window.location.href = "/customer/requests/new/submit";
  }

  return (
    <div className="px-6 py-12 space-y-10">
      <TeslaStepper steps={["Photos", "AI Review", "Submit"]} current={2} />

      <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
        <h2 className="text-xl font-semibold">AI Review</h2>

        {photoUrl && (
          <img
            src={photoUrl}
            className="w-full max-w-md rounded-xl shadow"
          />
        )}

        {loading ? (
          <div className="text-gray-500">Analyzing…</div>
        ) : (
          <div className="space-y-4">
            <div>
              <strong>Problem Detection:</strong>
              <pre className="text-sm bg-gray-100 p-2 rounded-lg">
                {JSON.stringify(analysis.problem, null, 2)}
              </pre>
            </div>

            <div>
              <strong>Next Service:</strong>
              <pre className="text-sm bg-gray-100 p-2 rounded-lg">
                {JSON.stringify(analysis.nextService, null, 2)}
              </pre>
            </div>

            <div>
              <strong>Parts Needed:</strong>
              <pre className="text-sm bg-gray-100 p-2 rounded-lg">
                {JSON.stringify(analysis.parts, null, 2)}
              </pre>
            </div>

            <div>
              <strong>Summary:</strong>
              <pre className="text-sm bg-gray-100 p-2 rounded-lg">{summary}</pre>
            </div>
          </div>
        )}

        {!loading && (
          <button
            onClick={handleNext}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
