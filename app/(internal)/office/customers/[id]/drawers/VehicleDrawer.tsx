"use client";

export default function VehicleDrawer(props: any) {
  // If no vehicle is selected, don't show anything
  if (!props.selected) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl border-l z-50 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Vehicle Details</h2>
        <button 
          onClick={() => props.setSelected(null)}
          className="text-gray-500 hover:text-black"
        >
          Close
        </button>
      </div>
      <div className="p-4 bg-gray-50 rounded text-sm text-gray-600">
        Vehicle Drawer Placeholder
      </div>
    </div>
  );
}