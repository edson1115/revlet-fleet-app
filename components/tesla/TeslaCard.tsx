import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void; // <--- Added this!
}

export default function TeslaCard({ children, className = "", onClick }: Props) {
  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
      onClick={onClick} // <--- And this!
    >
      {children}
    </div>
  );
}