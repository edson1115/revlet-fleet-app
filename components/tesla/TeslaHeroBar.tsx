import { TeslaDivider } from "./TeslaDivider";

type Props = {
  title: string;
  status?: string;
  meta?: Array<{ label: string; value: string | null }>;
};

export function TeslaHeroBar({ title, status, meta = [] }: Props) {
  return (
    <div className="w-full">
      {/* Top Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Title */}
        <h1 className="text-[28px] font-semibold tracking-tight text-black">
          {title}
        </h1>

        {/* Status Chip */}
        {status ? (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-black text-white">
            {status.replace(/_/g, " ")}
          </span>
        ) : null}
      </div>

      {/* Metadata Row */}
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-6 mt-2 text-[13px] text-gray-600">
          {meta.map((m, i) => (
            <div key={i}>
              <span className="font-medium text-gray-800">{m.label}:</span>{" "}
              {m.value || "—"}
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="mt-4">
        <TeslaDivider />
      </div>
    </div>
  );
}
