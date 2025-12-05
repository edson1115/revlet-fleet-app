export function TeslaPageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10">
      <h1 className="text-[32px] font-semibold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-gray-600 text-[15px] mt-1">{subtitle}</p>
      )}
    </div>
  );
}
