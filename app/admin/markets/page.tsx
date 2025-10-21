// app/admin/markets/page.tsx
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/rbac";
import MarketsClient from "./ui/MarketsClient";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Markets Management</h2>
      <p className="text-sm text-gray-600">
        Create, rename, and delete <strong>Markets</strong> (company locations where <code>location_type = 'MARKET'</code>).
        Assign/unassign customers to a selected market.
      </p>
      <MarketsClient />
    </section>
  );
}
