// app/admin/markets/page.tsx
import MarketsAdminClient from "./ui/MarketsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminMarketsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Markets Management</h1>
        <p className="text-sm text-gray-500">Create, rename, reorder, and assign customers to markets.</p>
      </div>
      <MarketsAdminClient />
    </div>
  );
}



