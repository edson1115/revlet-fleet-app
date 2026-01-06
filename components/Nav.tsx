import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function Nav() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  const email = auth.user?.email ?? "";
  let role = "GUEST";

  if (auth.user?.id) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    role = (prof?.role || "CUSTOMER").toUpperCase();
  }

  // Permissions
  const isOffice = ["ADMIN", "OFFICE", "SUPERADMIN"].includes(role);
  const isDispatch = ["ADMIN", "DISPATCH", "SUPERADMIN"].includes(role);
  const isTech = ["ADMIN", "TECH", "SUPERADMIN"].includes(role);
  const isAdmin = ["ADMIN", "SUPERADMIN"].includes(role);

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        
        {/* LEFT: Logo & Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl tracking-tight">
            Revlet
          </Link>

          {role !== "GUEST" && (
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600">
                {/* 1. Everyone (except Guests) goes to their Dashboard */}
                {role === "CUSTOMER" && <NavLink href="/customer" label="Dashboard" />}
                
                {/* 2. Role Based Links (Point to NEW Roots) */}
                {isOffice && <NavLink href="/office" label="Office" />}
                {isDispatch && <NavLink href="/dispatch" label="Dispatch" />}
                {isTech && <NavLink href="/tech" label="Tech App" />}
                
                {/* 3. Shared Tools */}
                {(isOffice || isDispatch) && <NavLink href="/reports" label="Reports" />}
                {isAdmin && <NavLink href="/admin" label="Admin" />}
              </nav>
          )}
        </div>

        {/* RIGHT: User Profile */}
        <div className="flex items-center gap-4 text-sm">
          {email && (
             <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="font-bold text-gray-900">{email.split('@')[0]}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{role}</span>
             </div>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

// Helper Component for styling
function NavLink({ href, label }: { href: string; label: string }) {
    return (
        <Link 
            href={href} 
            className="px-3 py-2 rounded-lg hover:bg-gray-100 hover:text-black transition"
        >
            {label}
        </Link>
    );
}