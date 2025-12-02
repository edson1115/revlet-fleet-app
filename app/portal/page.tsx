// app/portal/page.tsx
import { resolveUserScope } from "@/lib/api/scope";

export default async function PortalHome() {
  const scope = await resolveUserScope();

  if (!scope.isCustomer) {
    return <div className="p-10 text-red-600">Access denied</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-10 space-y-10">

      <h1 className="text-4xl font-semibold tracking-tight">Customer Portal</h1>

      <p className="text-gray-600 text-lg">
        Submit new service requests, manage your fleet, and check active jobs.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <Card
          title="New Request"
          desc="Create a service request for any vehicle in your fleet."
          href="/portal/request/new"
        />

        <Card
          title="Vehicles"
          desc="View your full fleet and track repair history."
          href="/portal/vehicles"
        />

        <Card
          title="Active Requests"
          desc="Check status, scheduled time, and technician assignment."
          href="/portal/requests"
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
