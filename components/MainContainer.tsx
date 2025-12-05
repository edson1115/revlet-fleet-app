// components/MainContainer.tsx
"use client";

import { ReactNode } from "react";

export default function MainContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16">
      {children}
    </div>
  );
}



