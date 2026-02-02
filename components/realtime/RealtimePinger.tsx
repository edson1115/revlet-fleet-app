"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner"; 

const PLAY_SOUND = () => {
    // 🎵 Standard "Ding" sound
    const audio = new Audio("https://cdn.freesound.org/previews/337/337049_3232293-lq.mp3"); 
    audio.volume = 0.6;
    
    // Play, but catch error if browser blocks it (Common in Incognito)
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn("⚠️ Audio blocked by browser. User must interact with page first.", error);
        });
    }
};

export default function RealtimePinger({ role, userId }: { role: "OFFICE" | "CUSTOMER" | "TECH", userId?: string | number }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 🔍 DEBUG: Check if we are even listening with the right ID
    if (role === "CUSTOMER") {
        console.log(`🎧 [Pinger] Customer Listener Active. Listening for Customer ID:`, userId);
    }

    const channel = supabase
      .channel('realtime-pings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests' },
        (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            // 🔍 DEBUG: See what came in from the DB
            // console.log("⚡ [Pinger] Event Received:", eventType, newRecord);

            // ------------------------------------------
            // 🔔 LOGIC 1: OFFICE / DISPATCH PING
            // ------------------------------------------
            if (role === "OFFICE") {
                if (eventType === "INSERT") {
                    PLAY_SOUND();
                    toast.message("🔔 New Request", { description: `${newRecord.service_title || "Service"} requested.` });
                }
                
                if (eventType === "UPDATE" && newRecord.status === "READY_TO_SCHEDULE" && oldRecord.status !== "READY_TO_SCHEDULE") {
                    PLAY_SOUND();
                    toast.success("✅ Approved & Ready", { description: "Ticket is ready for dispatching." });
                }
            }

            // ------------------------------------------
            // 🔔 LOGIC 2: CUSTOMER PING
            // ------------------------------------------
            if (role === "CUSTOMER") {
                
                // 🔍 DEBUG: Check why it matched or failed
                const isMatch = String(newRecord.customer_id) === String(userId);
                if (!isMatch) {
                    // console.log(`❌ [Pinger] Ignored update. Record Owner: ${newRecord.customer_id} !== My ID: ${userId}`);
                    return; 
                }

                // If we get here, the ID matched!
                if (eventType === "UPDATE" && newRecord.status !== oldRecord.status) {
                    
                    PLAY_SOUND(); // 🎵 Try to play sound
                    
                    // Show Visual Toast (This should ALWAYS work if ID matches)
                    const statusPretty = newRecord.status.replace(/_/g, " ");
                    
                    if (newRecord.status === "EN_ROUTE") {
                        toast.info("🚗 Technician En Route", { 
                            description: "Head's up! We are on the way.",
                            duration: 10000, // Show for 10 seconds
                        });
                    } else if (newRecord.status === "COMPLETED") {
                        toast.success("🎉 Job Completed", { 
                            description: "Your service is finished.",
                            duration: 10000,
                        });
                    } else if (newRecord.status === "APPROVED_AND_SCHEDULING") {
                         toast.success("✅ Request Approved", {
                            description: "Dispatch is now scheduling your tech."
                         });
                    } else {
                        toast.info(`Status Update: ${statusPretty}`);
                    }
                }
            }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, userId]);

  return null; 
}