import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans text-zinc-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        
        <div className="bg-black px-8 py-6 text-center">
          <h1 className="text-xl font-black tracking-tighter italic text-white">REVLET</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Support Center</p>
        </div>

        <div className="p-8 text-center space-y-6">
          <div>
            <h2 className="text-xl font-black text-zinc-900 mb-2">Need Help?</h2>
            <p className="text-sm text-zinc-500 font-medium">
              Our support team is available Mon-Fri, 8am - 6pm CST.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="space-y-3">
            <a href="mailto:support@venturemarketingpartners.com" className="block p-4 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-300 transition group">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Email Support</div>
                <div className="text-lg font-black text-zinc-900 group-hover:text-blue-600 transition">info@venturemarketingpartners.com</div>
            </a>

            <a href="tel:555-123-4567" className="block p-4 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-300 transition group">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone Support</div>
                <div className="text-lg font-black text-zinc-900 group-hover:text-blue-600 transition">(830) 356-3456</div>
            </a>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <Link href="/login" className="text-xs font-bold text-zinc-400 hover:text-black transition">
              ← Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}