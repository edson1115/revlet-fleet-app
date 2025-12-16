// app/office/requests/[id]/auto-integrate/page.tsx
"use client";

import { useParams } from "next/navigation";
import AiDraftComposer from "./AiDraftComposer";

export default function AutoIntegrateDraftPage() {
  const params = useParams();
  const id = params?.id as string;

  if (!id) {
    return <div className="p-6 text-red-600">Invalid request ID</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        AutoIntegrate Draft – Request #{id}
      </h1>

      <AiDraftComposer requestId={id} />
    </div>
  );
}
