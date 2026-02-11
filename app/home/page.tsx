import { resolveUserScope } from "@/lib/api/scope";

export default async function HomePage() {
  const scope = await resolveUserScope();

  // FIX: Use isSuperadmin instead of isSuper
  if (!scope.isSuperadmin) {
    return <div className="p-10 text-red-600">Access denied</div>;
  }

  return (
    <div className="p-10">
      <h1 className="text-4xl font-semibold mb-6">Superadmin Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Full system access. Manage users, markets, locations, and system tools.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="User Management" desc="Create, edit, and assign access roles." />
        <Card title="Markets" desc="Manage supported markets across the platform." />
        <Card title="Companies" desc="Add / modify fleet companies." />
        <Card title="System Logs" desc="View global audit logs and system events." />
      </div>
    </div>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border rounded-xl p-6 hover:shadow-md transition bg-white">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}