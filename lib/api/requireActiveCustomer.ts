export async function requireActiveCustomer(
  supabase,
  customerId: string
) {
  const { data } = await supabase
    .from("customers")
    .select("status")
    .eq("id", customerId)
    .single();

  if (data?.status !== "ACTIVE") {
    throw new Error("CUSTOMER_NOT_ACTIVE");
  }
}
