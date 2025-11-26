// app/portal/invoices/page.tsx

export default async function InvoicesPage() {
  // TODO: Replace with real billing data
  const invoices = [
    {
      id: "INV-2025-01",
      month: "January 2025",
      services: 37,
      amount: "$4,210.00",
    },
    {
      id: "INV-2024-12",
      month: "December 2024",
      services: 41,
      amount: "$4,890.00",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Invoices</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="text-xl font-medium">{inv.month}</div>

            <div className="mt-3 text-sm text-gray-600">
              {inv.services} services
            </div>

            <div className="mt-1 text-lg font-semibold text-gray-900">
              {inv.amount}
            </div>

            <div className="mt-4">
              <button className="text-sm text-gray-900 underline">
                Download PDF →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
