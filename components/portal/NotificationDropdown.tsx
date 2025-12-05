"use client";

export default function NotificationDropdown({ items }: { items: any[] }) {
  if (!items.length) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-4 text-sm text-gray-500">
        No recent updates
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-xl p-3 space-y-2">
      {items.slice(0, 10).map((item) => (
        <div
          key={item.id}
          className="border-b last:border-0 pb-2 last:pb-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
        >
          <div className="text-sm">{item.text}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            {new Date(item.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}



