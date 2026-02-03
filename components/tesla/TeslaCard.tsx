import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function TeslaCard({ children, className = "" }: Props) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}