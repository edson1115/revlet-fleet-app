export function TeslaActivityRow({ act }: any) {
  return (
    <div className="px-4 py-3">
      <p className="text-sm text-gray-900">
        <span className="font-semibold">{act.customer_name}</span> —{" "}
        {act.description}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(act.created_at).toLocaleString()}
      </p>
    </div>
  );
}
