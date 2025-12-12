export function TeslaTechAvailability({ techs }: any) {
  return (
    <div className="bg-white border rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Technician Availability
      </h3>

      <div className="flex flex-col gap-4">
        {techs.map((t: any) => (
          <div key={t.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{t.name}</div>
              <div className="text-sm text-gray-600">{t.market}</div>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-sm ${
                t.available
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {t.available ? "Available" : "Busy"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
