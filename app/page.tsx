// app/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import SignInForm from "@/components/auth/SignInForm";
import ToastOnMount from "@/components/ToastOnMount";

// server component – safe to read searchParams directly in the signature
export default async function Home({
  searchParams,
}: {
  searchParams?: { msg?: string };
}) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // role-aware routing when already logged in
    let role = "VIEWER";
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (prof?.role) role = String(prof.role).toUpperCase();
    if (role === "TECH") redirect("/tech");
    redirect("/fm/requests/new");
  }

  // not authed: show hero + magic link form
  const msg = searchParams?.msg ?? null;

  return (
    <main className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Client shim to show toast when ?msg=signedout */}
      <ToastOnMount when={msg} success="Signed out successfully!" />

      <div className="text-center px-6">
        <h1 className="text-5xl font-semibold mb-3 text-gray-900">Revlet Fleet</h1>
        <p className="text-gray-600 mb-8">
          Manage, schedule, and automate your fleet operations with confidence.
        </p>
        <div className="mx-auto w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Sign in</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enter your work email and we’ll email you a secure sign-in link.
          </p>
          <SignInForm next="/" />
        </div>
      </div>
    </main>
  );
}
