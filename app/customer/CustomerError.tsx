"use client";

import { useRouter } from "next/navigation";

export default function CustomerError({ userId, email, sysError }: { userId: string, email: string, sysError?: string }) {
  const router = useRouter();

  async function handleLogout() {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
  }

  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl animate-pulse">⚠️</div>
              
              <h1 className="text-2xl font-black text-gray-900 mb-2">Connection Error</h1>
              <p className="text-gray-500 mb-6">We could not retrieve your fleet profile.</p>
              
              <div className="bg-gray-100 p-4 rounded-lg text-xs font-mono text-gray-600 break-all mb-6 text-left">
                 <span className="font-bold text-gray-400 block mb-1">DATABASE ERROR:</span>
                 <span className="text-red-600 font-bold">{sysError || "Unknown Error"}</span>
                 <br/><br/>
                 <span className="font-bold text-gray-400 block mb-1">USER CONTEXT:</span>
                 ID: {userId} <br/>
                 User: {email}
              </div>

              <div className="space-y-3">
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition"
                  >
                    Try Again / Refresh
                  </button>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full py-3 text-gray-400 font-bold hover:text-red-500 transition text-sm"
                  >
                    Sign Out
                  </button>
              </div>
          </div>
      </div>
  );
}