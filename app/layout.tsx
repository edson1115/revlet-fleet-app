import "./globals.css";
import { Inter } from "next/font/google";

import { LocationScopeProvider } from "@/lib/useLocationScope";
import { RequestDrawerHost } from "@/components/RequestDrawerHost";

import { TeslaSidebar } from "@/components/tesla/TeslaSidebar";
import { RoleStatusBar } from "@/components/RoleStatusBar";

import { AuthProfileInit } from "@/components/AuthProfileInit"; // <-- FIXED

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>

        <AuthProfileInit />   {/* <-- Ensures profile exists */}

        <LocationScopeProvider>

          <TeslaSidebar />

          <RoleStatusBar />

          <div className="ml-56">{children}</div>
        </LocationScopeProvider>

        <RequestDrawerHost />
      </body>
    </html>
  );
}
