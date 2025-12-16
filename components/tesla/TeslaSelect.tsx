"use client";

export default function TeslaSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  className = "",
  ...props
}: {
  label?: string;
  value?: any;
  onChange?: any;
  options?: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col space-y-1 w-full">
      {label && (
        <label className="text-sm text-gray-600 font-medium px-1">
          {label}
        </label>
      )}

      <select
        value={value}
        onChange={onChange}
        {...props}
        className={`w-full border border-gray-300 rounded-xl px-4 py-2 
          text-sm bg-white focus:outline-none focus:ring-[2px] 
          focus:ring-black transition-all ${className}`}
      >
        <option value="">{placeholder}</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
