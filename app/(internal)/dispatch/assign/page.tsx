import { Suspense } from "react";
import AssignClient from "./ui/AssignClient";

export const dynamic = "force-dynamic";

export default function AssignPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Assign / Re-Assign</h1>
      <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
        <AssignClient requestId="" techs={[]} />
      </Suspense>
    </div>
  );
}



