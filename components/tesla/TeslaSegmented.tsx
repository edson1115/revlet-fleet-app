"use client";

type Option = {
  label: string;
  value: string;
};

export function TeslaSegmented({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-gray-100 p-1">
      {options.map((opt) => {
        const active = opt.value === value;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              if (onChange) {
                onChange(opt.value);
              }
            }}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all
              ${
                active
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black"
              }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
