export function TeslaSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="uppercase text-[11px] font-medium tracking-wide text-gray-500">
        {label}
      </p>
      <div className="bg-[#F8F8F8] rounded-lg p-3 text-sm text-gray-900">
        {children}
      </div>
    </div>
  );
}
