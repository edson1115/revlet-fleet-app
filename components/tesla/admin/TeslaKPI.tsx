export function TeslaKPI({ label, value, badge }: any) {
  const badgeColors: any = {
    warning: "bg-yellow-500",
    success: "bg-green-600",
    danger: "bg-red-600",
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500">{label}</p>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-2xl font-bold tracking-tight text-gray-900">
          {value}
        </span>

        {badge && (
          <span
            className={`text-white text-xs px-2 py-0.5 rounded-full ${badgeColors[badge]}`}
          >
            {badge.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
