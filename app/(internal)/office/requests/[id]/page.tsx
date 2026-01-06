"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import OfficeRequestDetailClient from "./OfficeRequestDetailClient";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookieOptions: {
            name: "sb-revlet-auth-token",
          },
        }
      );

      console.log("📡 Fetching Office request:", id);

      const { data: request, error } = await supabase
        .from("service_requests")
        .select(`
          *,
          customer:customers (
            id,
            name,
            email,
            phone
          ),
          vehicle:vehicles (
            id,
            vin,
            year,
            make,
            model,
            unit_number,
            plate
          ),
          technician:technician_id (
            id,
            full_name
          ),
          second_technician:second_technician_id (
            id,
            full_name
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ SUPABASE ERROR:", error.message);
        setLoading(false);
        return;
      }

      // ✅ Normalize tech assignments for OFFICE (read-only)
      const assignedTechs: string[] = [];
      if (request?.technician?.full_name) {
        assignedTechs.push(request.technician.full_name);
      }
      if (request?.second_technician?.full_name) {
        assignedTechs.push(request.second_technician.full_name);
      }

      // ✅ Normalize mileage for display
      const displayMileage =
        request?.reported_mileage ??
        request?.mileage ??
        null;

      const normalizedRequest = {
        ...request,
        assigned_techs: assignedTechs,
        display_mileage: displayMileage,
      };

      console.log("✅ Office request loaded:", normalizedRequest);
      setData(normalizedRequest);
      setLoading(false);
    };

    fetchData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-400 animate-pulse">
          Loading Request...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold">Request Not Found</h2>
        <p className="text-gray-500 mb-4">
          You might need to enable RLS for <code>service_requests</code>.
        </p>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  return <OfficeRequestDetailClient request={data} />;
}
