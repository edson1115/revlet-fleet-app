"use client";

export function TeslaSegmented({ value, onChange, options }: any) {
  return (
    <div className="inline-flex bg-gray-100 p-1 rounded-xl">
      {options.map((opt: any) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={
              "px-4 py-2 text-sm rounded-lg transition " +
              (active
                ? "bg-black text-white shadow"
                : "text-gray-600 hover:text-black")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
