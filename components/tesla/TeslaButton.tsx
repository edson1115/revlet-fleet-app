export function TeslaButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="mt-8 w-full bg-black text-white py-3 rounded-lg text-sm hover:bg-[#111] transition"
    >
      {children}
    </button>
  );
}
