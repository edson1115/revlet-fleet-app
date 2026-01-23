import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans text-zinc-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-zinc-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-2xl font-black text-zinc-900 mb-2">Application Received</h1>
        <p className="text-zinc-500 mb-6">
            Thank you for registering with Revlet. To ensure platform security, our team verifies all new fleet accounts manually.
        </p>
        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-sm font-medium text-zinc-600 mb-6">
            We will contact you shortly at your provided phone number to complete verification.
        </div>
        <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Return to Login
        </Link>
      </div>
    </div>
  );
}