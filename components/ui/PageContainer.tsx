// components/ui/PageContainer.tsx
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-6xl mx-auto px-4 py-6 animate-fade-in",
        className
      )}
    >
      {children}
    </div>
  );
}



