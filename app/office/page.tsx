// app/office/page.tsx
import { resolveUserScope } from "@/lib/api/scope";

export default async function OfficePage() {
  const scope = await resolveUserScope();

  if (!scope.isInternal) {
    return <div className="p-10 text-red-600">Access denied</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-10 space-y-10">

      <h1 className="text-4xl font-semibold tracking-tight">
        Office Dashboard
      </h1>

      <p className="text-gray-600 text-lg">
        Manage customers, requests, scheduling, and fleet operations in your markets.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <Card
          title="Service Requests"
          desc="View and manage all incoming and active service requests."
          href="/office/requests"
        />

        <Card
          title="Customers"
          desc="Access customer accounts, vehicles, and service history."
          href="/office/customers"
        />

        <Card
          title="Scheduling"
          desc="Assign technicians and manage schedule windows."
          href="/dispatch"
        />

        <Card
          title="Reports"
          desc="View metrics, performance, and service summaries."
          href="/office/reports"
        />

      </div>
    </div>
  );
}

function Card({ title, desc, href }: any) {
  return (
    <a
      href={href}
      className="block border rounded-2xl p-6 bg-white shadow-sm hover:shadow-lg transition"
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600">{desc}</p>
    </a>
  );
}



