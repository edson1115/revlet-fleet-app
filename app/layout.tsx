// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Revlet",
  description: "Fleet Service Automation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
