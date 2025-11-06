import "./globals.css";
import MainNav from "@/components/MainNav";
import ToastProvider from "@/components/ToastProvider";

export const metadata = {
  title: "Revlet Fleet",
  description: "Fleet scheduling, dispatch and tech workflows",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MainNav />
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
