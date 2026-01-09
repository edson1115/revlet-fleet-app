"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import OfficeRequestDetailClient from "./OfficeRequestDetailClient";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
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

      // 1. Fetch Request + Images + Parts
      const requestPromise = supabase
        .from("service_requests")
        .select(`
          *,
          customer:customers (id, name, email, phone),
          vehicle:vehicles (id, vin, year, make, model, unit_number, plate),
          technician:technician_id (id, full_name),
          second_technician:second_technician_id (id, full_name),
          request_images (*),
          request_parts (*)
        `)
        .eq("id", id)
        .single();

      // 2. Fetch Audit Logs
      const logsPromise = supabase
        .from("activity_logs")
        .select("*")
        .eq("request_id", id)
        .order("created_at", { ascending: false });

      const [reqRes, logsRes] = await Promise.all([requestPromise, logsPromise]);

      if (reqRes.error) {
        console.error("❌ SUPABASE ERROR:", reqRes.error.message);
        setLoading(false);
        return;
      }

      const request = reqRes.data;

      // Normalize tech names
      const assignedTechs: string[] = [];
      if (request?.technician?.full_name) assignedTechs.push(request.technician.full_name);
      if (request?.second_technician?.full_name) assignedTechs.push(request.second_technician.full_name);

      const normalizedRequest = {
        ...request,
        assigned_techs: assignedTechs,
        display_mileage: request?.reported_mileage ?? request?.mileage ?? null,
      };

      setData(normalizedRequest);
      setLogs(logsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [id, router]);

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400 animate-pulse">Loading...</div>;
  if (!data) return <div className="p-12 text-center"><h2 className="text-xl font-bold">Not Found</h2></div>;

  return <OfficeRequestDetailClient request={data} logs={logs} />;
}