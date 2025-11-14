import PortalNav from "@/components/PortalNav";

export default function PortalLayout({ children }) {
  return (
    <div>
      <PortalNav />
      {children}
    </div>
  );
}
