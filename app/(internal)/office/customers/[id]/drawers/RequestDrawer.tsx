"use client";

import { Dispatch, SetStateAction } from "react";

// Accepting 'any' props ensures this works regardless of what the parent passes it
export default function RequestDrawer(props: any) {
  // If no item is selected/open, don't render anything
  if (!props.selected && !props.isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl border-l z-50 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Request Details</h2>
        <button 
          onClick={props.onClose}
          className="text-gray-500 hover:text-black"
        >
          Close
        </button>
      </div>
      <div className="p-4 bg-gray-50 rounded text-sm text-gray-600">
        Request Drawer Placeholder
      </div>
    </div>
  );
}