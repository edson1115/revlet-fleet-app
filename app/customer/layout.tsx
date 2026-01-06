import CustomerSidebar from "./CustomerSidebar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-row font-sans">
      {/* The Sidebar stays fixed on the left */}
      <CustomerSidebar />
      
      {/* The Page Content changes on the right */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}