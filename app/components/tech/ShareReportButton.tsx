"use client";

import { generateShareLink } from "@/app/actions/admin";
import { useState } from "react";

export default function ShareReportButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const { shareUrl } = await generateShareLink(requestId);
      
      // Attempt native mobile sharing (iOS/Android)
      if (navigator.share) {
        await navigator.share({
          title: 'Revlet Service Report',
          text: 'Your vehicle service is complete. View your audit-ready report here:',
          url: shareUrl,
        });
      } else {
        // Desktop fallback: Clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied! You can now paste this into an email or text.");
      }
    } catch (err) {
      console.error("Share failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleShare}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-xl active:scale-95 disabled:opacity-50"
    >
      {loading ? "Generating..." : "📲 Share Report via SMS"}
    </button>
  );
}