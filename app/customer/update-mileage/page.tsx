import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function UpdateMileagePage(props: any) {
  const searchParams = await props.searchParams;
  const vehicleId = searchParams.vehicle_id;

  if (!vehicleId) {
    return <div className="p-6 text-red-600">Missing vehicle_id.</div>;
  }

  const supabase = await supabaseServer();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .maybeSingle();

  if (!vehicle) {
    return <div className="p-6 text-red-600">Vehicle not found.</div>;
  }

  const mileage =
    vehicle.mileage_override ??
    vehicle.last_reported_mileage ??
    "";

  // SERVER ACTION
  async function update(formData: FormData) {
    "use server";

    const supabase = await supabaseServer();
    const newMileage = Number(formData.get("mileage"));

    await supabase
      .from("vehicles")
      .update({
        mileage_override: newMileage,
        last_reported_mileage: newMileage,
        last_mileage_at: new Date().toISOString(),
      })
      .eq("id", vehicleId);

    redirect(`/customer/vehicles`);
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-2">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>

      <div className="text-gray-600 mb-6 text-sm">
        Last Mileage: {mileage ? mileage.toLocaleString() : "—"}
      </div>

      <form action={update} className="space-y-5">
        <input
          type="number"
          name="mileage"
          defaultValue={mileage}
          className="w-full border rounded-xl p-3 text-lg"
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-xl text-lg font-medium"
        >
          Save Mileage
        </button>
      </form>
    </div>
  );
}
