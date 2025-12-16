"use client";

export default function TeslaButton({
  children,
  onClick,
  type = "button",
  className = "",
}: {
  children: any;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        w-full bg-black text-white rounded-xl py-3 text-sm font-semibold 
        hover:bg-gray-800 active:bg-gray-900 transition-all 
        ${className}
      `}
    >
      {children}
    </button>
  );
}
