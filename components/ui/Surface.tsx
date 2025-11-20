// components/ui/Surface.tsx
import { cn } from "@/lib/utils";

export function Surface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-[#F5F5F5] rounded-xl p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
