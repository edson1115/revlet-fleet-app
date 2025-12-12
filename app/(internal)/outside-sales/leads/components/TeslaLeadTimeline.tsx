export function TeslaLeadTimeline({ updates }: any) {
  if (!updates?.length)
    return (
      <div className="text-gray-400 text-sm">No updates yet.</div>
    );

  return (
    <div className="space-y-4">
      {updates.map((u: any, i: number) => (
        <div key={i} className="flex gap-3">
          <div className="w-3 h-3 bg-black rounded-full mt-1" />
          <div>
            <div className="text-sm text-gray-800">{u.update_text}</div>
            <div className="text-[11px] text-gray-400">
              {new Date(u.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
