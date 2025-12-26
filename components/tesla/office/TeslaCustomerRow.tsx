"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";

type CustomerRowProps = {
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    market?: string;
    active?: boolean;
    vehicle_count?: number;
  };
  onClick?: () => void;
};

export function TeslaCustomerRow({ customer, onClick }: CustomerRowProps) {
  const router = useRouter();

  function handleClick() {
    if (onClick) {
      onClick();
    } else {
      // Default navigation if no onClick provided
      router.push(`/office/customers/${customer.id}`);
    }
  }

  return (
    <div
      onClick={handleClick}
      className="group flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition cursor-pointer first:rounded-t-xl last:rounded-b-xl border-b border-gray-100 last:border-0"
    >
      {/* LEFT: INFO */}
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            "w-2 h-2 rounded-full",
            customer.active !== false ? "bg-green-500" : "bg-gray-300"
          )}
        />
        <div>
          <div className="font-bold text-gray-900">{customer.name}</div>
          <div className="text-xs text-gray-500 flex gap-3">
            <span>{customer.market || "No Market"}</span>
            {customer.vehicle_count !== undefined && (
              <>
                <span>•</span>
                <span>{customer.vehicle_count} Vehicles</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: CONTACT & ARROW */}
      <div className="flex items-center gap-6">
        <div className="text-right text-sm text-gray-500 hidden sm:block">
          <div>{customer.email || "—"}</div>
          <div className="text-xs text-gray-400">{customer.phone || ""}</div>
        </div>
        <span className="text-gray-300 group-hover:text-black font-bold text-xl transition">
          ›
        </span>
      </div>
    </div>
  );
}