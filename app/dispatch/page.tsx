// app/dispatch/page.tsx
import { resolveUserScope } from "@/lib/api/scope";
import DispatchQueueClient from "./queue/ui/DispatchQueueClient";

export default async function DispatchPage() {
  const scope = await resolveUserScope();

  if (!scope.isInternal) {
    return <div className="p-10 text-red-600">Access denied</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-4xl font-semibold tracking-tight">Dispatch Queue</h1>
      <p className="text-gray-600 text-lg">
        Review incoming requests, assign technicians, and schedule service windows.
      </p>

      <DispatchQueueClient />
    </div>
  );
}
