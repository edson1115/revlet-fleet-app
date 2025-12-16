"use client";

export default function TeslaInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  ...props
}: {
  label?: string;
  type?: string;
  value?: any;
  onChange?: any;
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

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
        className={`w-full border border-gray-300 rounded-xl px-4 py-2 
          text-sm focus:outline-none focus:ring-[2px] 
          focus:ring-black transition-all ${className}`}
      />
    </div>
  );
}
