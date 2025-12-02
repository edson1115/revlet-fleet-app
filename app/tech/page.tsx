// app/tech/page.tsx
import { resolveUserScope } from "@/lib/api/scope";

export default async function TechPage() {
  const scope = await resolveUserScope();

  if (!scope.isTech) {
    return <div className="p-10 text-red-600">Access denied</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-10 space-y-10">

      <h1 className="text-4xl font-semibold tracking-tight">Technician Dashboard</h1>

      <p className="text-gray-600 text-lg">
        View your assigned jobs, upload before/after photos, and update completion status.
      </p>

      <div className="border rounded-2xl bg-white p-10 shadow-sm">
        <p className="text-gray-500">
          Your Tesla-style technician job list will load here.
        </p>
      </div>

    </div>
  );
}
