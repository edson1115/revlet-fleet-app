// app/layout.tsx
import "./globals.css";
import TopBar from "@/components/TopBar";

export const metadata = {
  title: "Revlet Fleet",
  description: "Fleet management platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopBar />
        {children}
      </body>
    </html>
  );
}
