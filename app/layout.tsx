import "./globals.css";
import { LocationScopeProvider } from "@/lib/useLocationScope";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LocationScopeProvider>
          {children}
        </LocationScopeProvider>
      </body>
    </html>
  );
}
