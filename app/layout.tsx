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

if (typeof window !== "undefined") {
  try {
    // Prevent duplicate custom element registration
    window.customElements.define = new Proxy(
      window.customElements.define,
      {
        apply(target, thisArg, args) {
          try {
            return Reflect.apply(target, thisArg, args);
          } catch {
            return;
          }
        },
      }
    );
  } catch {}
}
