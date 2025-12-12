export default function KPIs() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="p-4 bg-white rounded-xl shadow">
        <div className="text-2xl font-semibold">12</div>
        <div className="text-xs text-gray-500">New Leads</div>
      </div>

      <div className="p-4 bg-white rounded-xl shadow">
        <div className="text-2xl font-semibold">5</div>
        <div className="text-xs text-gray-500">Conversions</div>
      </div>

      <div className="p-4 bg-white rounded-xl shadow">
        <div className="text-2xl font-semibold">14</div>
        <div className="text-xs text-gray-500">Visits Logged</div>
      </div>

      <div className="p-4 bg-white rounded-xl shadow">
        <div className="text-2xl font-semibold">3</div>
        <div className="text-xs text-gray-500">Pending Approvals</div>
      </div>
    </div>
  );
}
