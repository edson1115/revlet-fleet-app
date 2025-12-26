"use client";

import { useRouter, usePathname } from "next/navigation";

export function TeslaAddVehicleButton() {
  const router = useRouter();
  const pathname = usePathname(); 
  // pathname is usually "/office/customers/[id]"
  // We can just append "/add-vehicle" to the current path safely

  function handleClick() {
    router.push(`${pathname}/add-vehicle`);
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-2 transition"
    >
      <span className="text-lg">+</span> Add Vehicle to Fleet
    </button>
  );
}