"use client";

export function TeslaAdminCustomerRow({ customer }: { customer: any }) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-all cursor-pointer">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
          <p className="text-sm text-gray-500">
            {customer.market || "No market assigned"}
          </p>
        </div>

        <span
          className={`px-2 py-1 text-xs rounded-lg ${
            customer.active
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          {customer.active ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}