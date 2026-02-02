// app/layout.tsx
import "./globals.css";
import { Toaster } from "sonner"; // ✅ ADDED: Import the Toast container

export const metadata = {
  title: "Revlet",
  description: "Fleet Service Automation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* ✅ ADDED: The container where popups will appear */}
        <Toaster position="top-right" richColors /> 
      </body>
    </html>
  );
}

// --- KEEPING YOUR EXISTING CUSTOM ELEMENT PATCH ---
if (typeof window !== "undefined") {
  try {
    // Prevent duplicate custom element registration
    window.customElements.define = new Proxy(
      window.customElements.define,
      {
        apply(target, thisArg, args) {
          try {
            // @ts-ignore
            return Reflect.apply(target, thisArg, args);
          } catch {
            return;
          }
        },
      }
    );
  } catch {}
}