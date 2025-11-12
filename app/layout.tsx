import "./globals.css";
import MainNav from "@/components/MainNav";
import ToastProvider from "@/components/ToastProvider";
import { LocationScopeProvider } from "@/lib/useLocationScope";

export const metadata = {
  title: "Revlet Fleet",
  description: "Fleet scheduling, dispatch and tech workflows",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LocationScopeProvider>
          <MainNav />
          <ToastProvider />
          {children}
        </LocationScopeProvider>
      </body>
    </html>
  );
}
