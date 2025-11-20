// components/ui/SectionTitle.tsx
import { cn } from "@/lib/utils";

export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-[22px] font-semibold tracking-tight text-black mb-4",
        className
      )}
    >
      {children}
    </h2>
  );
}
