// app/layout.tsx
import "./globals.css";
import { MeProvider } from "@/app/providers/UserContext";

export const metadata = {
  title: "Revlet Fleet",
  description: "Fleet service orchestration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MeProvider>{children}</MeProvider>
      </body>
    </html>
  );
}
